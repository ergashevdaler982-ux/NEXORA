"""NEXORA Flask application: Telegram WebApp + Admin panel + REST API."""
from __future__ import annotations

import hashlib
import hmac
import json
import logging
import os
import secrets
import time
import urllib.parse
from functools import wraps

from flask import Flask, jsonify, render_template, request, send_from_directory, session
from werkzeug.utils import secure_filename

import database as db
from config import Config

log = logging.getLogger("nexora.app")

_ORDER_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"


# ---------------------------------------------------------------- app factory
def create_app() -> Flask:
    app = Flask(__name__, template_folder="templates", static_folder="static")
    app.secret_key = Config.SECRET_KEY
    app.config.update(
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_HTTPONLY=True,
        MAX_CONTENT_LENGTH=Config.MAX_UPLOAD_MB * 1024 * 1024,
    )

    for folder in (Config.UPLOAD_DIR, Config.RECEIPT_DIR, Config.GAME_IMG_DIR, Config.LOGO_DIR):
        os.makedirs(folder, exist_ok=True)

    register_routes(app)
    return app


# ---------------------------------------------------------------- helpers
def _err(message: str, code: int = 400):
    return jsonify({"ok": False, "error": message}), code


def _tg_id_from_request() -> int | None:
    """Session first, explicit param second (WebView cookie fallback)."""
    if session.get("tg_id"):
        try:
            return int(session["tg_id"])
        except (TypeError, ValueError):
            pass
    for source in (request.args, request.form, request.view_args or {}):
        if source and "telegram_id" in source:
            try:
                return int(source["telegram_id"])
            except (TypeError, ValueError):
                pass
    if request.is_json:
        try:
            tid = (request.get_json(silent=True) or {}).get("telegram_id")
            return int(tid) if tid else None
        except (TypeError, ValueError):
            return None
    return None


def validate_init_data(init_data: str) -> dict | None:
    """Verify Telegram WebApp initData. Returns the `user` object or None."""
    if not init_data or not Config.BOT_TOKEN:
        return None
    try:
        parsed = dict(urllib.parse.parse_qsl(init_data, keep_blank_values=True))
        received = parsed.pop("hash", "")
        if not received:
            return None
        check_string = "\n".join(f"{k}={v}" for k, v in sorted(parsed.items()))
        secret = hmac.new(b"WebAppData", Config.BOT_TOKEN.encode(), hashlib.sha256).digest()
        calc = hmac.new(secret, check_string.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(calc, received):
            return None
        if abs(time.time() - int(parsed.get("auth_date", 0))) > 86400:
            return None
        user = json.loads(parsed.get("user", "{}"))
        return user if user.get("id") else None
    except Exception:
        return None


def _get_or_create_user(telegram_id: int, first_name="", last_name="", username="", language="") -> dict:
    user = db.fetchone("SELECT * FROM users WHERE telegram_id = %s", (telegram_id,))
    if user is None:
        lang = language if language in Config.LANGUAGES else db.get_setting("default_lang", "uz")
        db.execute(
            """INSERT INTO users (telegram_id, first_name, last_name, username, language, last_seen)
               VALUES (%s,%s,%s,%s,%s,%s)""",
            (telegram_id, first_name[:100], last_name[:100], username[:100], lang, db.now_str()),
        )
        user = db.fetchone("SELECT * FROM users WHERE telegram_id = %s", (telegram_id,))
    else:
        updates, params = [], []
        if first_name and first_name != user.get("first_name"):
            updates.append("first_name = %s"); params.append(first_name[:100])
        if username and username != user.get("username"):
            updates.append("username = %s"); params.append(username[:100])
        updates.append("last_seen = %s"); params.append(db.now_str())
        params.append(telegram_id)
        db.execute(f"UPDATE users SET {', '.join(updates)} WHERE telegram_id = %s", tuple(params))
        user = db.fetchone("SELECT * FROM users WHERE telegram_id = %s", (telegram_id,))
    return user


def _public_user(user: dict) -> dict:
    return {k: user.get(k) for k in
            ("id", "telegram_id", "first_name", "last_name", "username", "language", "created_at")}


def _gen_order_code() -> str:
    for _ in range(20):
        code = "NX-" + "".join(secrets.choice(_ORDER_ALPHABET) for _ in range(6))
        if db.fetchone("SELECT id FROM orders WHERE order_code = %s", (code,)) is None:
            return code
    return f"NX-{int(time.time()) % 1000000:06d}"


def _add_history(order_id: int, old: str, new: str, by: str, note: str = "") -> None:
    db.execute(
        "INSERT INTO order_history (order_id, old_status, new_status, changed_by, note, created_at)"
        " VALUES (%s,%s,%s,%s,%s,%s)",
        (order_id, old, new, by, note[:500], db.now_str()),
    )


_IMG_SIGS = (b"\xff\xd8\xff", b"\x89PNG", b"RIFF", b"\x00\x00\x00\x18ftyp",
             b"\x00\x00\x00 ftyp", b"\x00\x00\x00\x1cftyp")


def _validate_image(file) -> str | None:
    """Return error message or None. Leaves stream positioned at 0."""
    if file is None or not getattr(file, "filename", ""):
        return "no_file"
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in Config.ALLOWED_IMG_EXTS:
        return "bad_extension"
    head = file.stream.read(32)
    file.stream.seek(0)
    if not head.startswith(_IMG_SIGS):
        return "bad_content"
    file.stream.seek(0, os.SEEK_END)
    size = file.stream.tell()
    file.stream.seek(0)
    if size > Config.MAX_UPLOAD_MB * 1024 * 1024 or size < 1024:
        return "bad_size"
    return None


def _save_upload(file, folder: str, prefix: str) -> str:
    ext = secure_filename(file.filename).rsplit(".", 1)[-1].lower()
    name = f"{prefix}_{int(time.time() * 1000)}_{secrets.token_hex(3)}.{ext}"
    path = os.path.join(folder, name)
    file.save(path)
    return f"/uploads/{os.path.basename(folder)}/{name}"


def admin_password_effective() -> str:
    return db.get_setting("admin_password", "") or Config.ADMIN_PASSWORD


def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not session.get("is_admin"):
            return _err("unauthorized", 401)
        return fn(*args, **kwargs)
    return wrapper


def _page_args(default_per=20, max_per=100):
    try:
        page = max(1, int(request.args.get("page", 1)))
    except (TypeError, ValueError):
        page = 1
    try:
        per = min(max_per, max(1, int(request.args.get("per_page", default_per))))
    except (TypeError, ValueError):
        per = default_per
    return page, per


# ---------------------------------------------------------------- routes
def register_routes(app: Flask) -> None:

    # ---------------- pages ----------------
    @app.get("/")
    def page_index():
        return render_template("index.html")

    @app.get("/admin")
    def page_admin():
        return render_template("admin.html")

    @app.get("/uploads/<path:filename>")
    def serve_upload(filename: str):
        safe = os.path.normpath(filename).replace("\\", "/")
        if safe.startswith("..") or safe.startswith("/"):
            return _err("not_found", 404)
        return send_from_directory(Config.UPLOAD_DIR, safe)

    @app.get("/api/health")
    def health():
        return jsonify({"ok": True, "dialect": db.dialect()})

    # ---------------- auth (user) ----------------
    @app.post("/api/auth")
    def api_auth():
        data = request.get_json(silent=True) or {}
        tg_user = validate_init_data(data.get("init_data", "") or "") if data.get("init_data") else None

        if tg_user:
            telegram_id = int(tg_user["id"])
            first_name = tg_user.get("first_name", "")
            last_name = tg_user.get("last_name", "")
            username = tg_user.get("username", "")
            language = tg_user.get("language_code", "") or ""
        elif data.get("init_data"):
            return _err("bad_init_data", 401)  # forged initData
        elif data.get("telegram_id"):
            try:
                telegram_id = int(data["telegram_id"])
            except (TypeError, ValueError):
                return _err("bad_telegram_id")
            first_name = str(data.get("first_name", ""))[:100]
            last_name = str(data.get("last_name", ""))[:100]
            username = str(data.get("username", ""))[:100]
            language = str(data.get("language", ""))[:8]
        else:
            return _err("auth_required", 401)

        user = _get_or_create_user(telegram_id, first_name, last_name, username, language)
        if user.get("is_blocked"):
            return _err("blocked", 403)
        session["tg_id"] = telegram_id
        return jsonify({"ok": True, "user": _public_user(user)})

    # ---------------- public catalog ----------------
    @app.get("/api/settings/public")
    def api_public_settings():
        keys = ("app_name", "app_tagline_uz", "app_tagline_ru", "app_tagline_en",
                "logo_url", "hero_banner_url", "support_username",
                "support_text_uz", "support_text_ru", "support_text_en",
                "default_lang", "theme_primary", "theme_accent",
                "announcement_uz", "announcement_ru", "announcement_en")
        return jsonify({"ok": True, "settings": {k: db.get_setting(k, "") for k in keys}})

    @app.get("/api/games")
    def api_games():
        games = db.fetchall(
            """SELECT g.*, (SELECT COUNT(*) FROM packages p
                             WHERE p.game_id = g.id AND p.is_active = 1) AS package_count,
                            (SELECT MIN(p.price) FROM packages p
                             WHERE p.game_id = g.id AND p.is_active = 1) AS min_price
               FROM games g WHERE g.is_active = 1 ORDER BY g.sort_order, g.id""")
        return jsonify({"ok": True, "games": games})

    @app.get("/api/games/<int:game_id>")
    def api_game_detail(game_id: int):
        game = db.fetchone("SELECT * FROM games WHERE id = %s AND is_active = 1", (game_id,))
        if not game:
            return _err("game_not_found", 404)
        packages = db.fetchall(
            "SELECT * FROM packages WHERE game_id = %s AND is_active = 1 ORDER BY sort_order, price",
            (game_id,))
        return jsonify({"ok": True, "game": game, "packages": packages})

    @app.get("/api/payment-methods")
    def api_payment_methods():
        methods = db.fetchall(
            "SELECT * FROM payment_methods WHERE is_active = 1 ORDER BY sort_order, id")
        return jsonify({"ok": True, "methods": methods})

    # ---------------- orders (user) ----------------
    def _require_user():
        tid = _tg_id_from_request()
        if not tid:
            return None, _err("auth_required", 401)
        user = db.fetchone("SELECT * FROM users WHERE telegram_id = %s", (tid,))
        if not user:
            return None, _err("auth_required", 401)
        if user.get("is_blocked"):
            return None, _err("blocked", 403)
        return user, None

    @app.post("/api/orders")
    def api_create_order():
        user, err = _require_user()
        if err:
            return err
        data = request.get_json(silent=True) or {}
        try:
            game_id, package_id = int(data.get("game_id", 0)), int(data.get("package_id", 0))
        except (TypeError, ValueError):
            return _err("bad_request")
        first_name = str(data.get("first_name", "")).strip()[:100]
        last_name = str(data.get("last_name", "")).strip()[:100]
        game_username = str(data.get("game_username", "")).strip()[:150]
        if len(first_name) < 2 or len(game_username) < 2:
            return _err("validation")

        game = db.fetchone("SELECT * FROM games WHERE id = %s AND is_active = 1", (game_id,))
        package = db.fetchone(
            "SELECT * FROM packages WHERE id = %s AND game_id = %s AND is_active = 1",
            (package_id, game_id))
        if not game or not package:
            return _err("not_found", 404)

        code = _gen_order_code()
        order_id = db.execute(
            """INSERT INTO orders
               (order_code, user_id, telegram_id, game_id, package_id, game_name,
                package_name, package_amount, price, currency,
                first_name, last_name, game_username, status, created_at, updated_at)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'pending',%s,%s)""",
            (code, user["id"], user["telegram_id"], game_id, package_id, game["name"],
             package["name"], package.get("amount", ""), package["price"],
             package.get("currency", "UZS"), first_name, last_name, game_username,
             db.now_str(), db.now_str()),
        )
        _add_history(order_id, "", "pending", "user", "Order created")
        order = db.fetchone("SELECT * FROM orders WHERE id = %s", (order_id,))

        import bot as tg
        tg.notify_admin_new_order(order)
        return jsonify({"ok": True, "order": order})

    @app.get("/api/orders/mine")
    def api_my_orders():
        user, err = _require_user()
        if err:
            return err
        orders = db.fetchall(
            """SELECT o.*, g.image_url AS game_image, g.currency_name, g.color_from, g.color_to
               FROM orders o LEFT JOIN games g ON g.id = o.game_id
               WHERE o.user_id = %s ORDER BY o.id DESC LIMIT 100""",
            (user["id"],))
        return jsonify({"ok": True, "orders": orders})

    @app.get("/api/orders/<code>")
    def api_order_detail(code: str):
        user, err = _require_user()
        if err and not session.get("is_admin"):
            return err
        order = db.fetchone("SELECT * FROM orders WHERE order_code = %s", (code,))
        if not order:
            return _err("not_found", 404)
        if not session.get("is_admin") and order["user_id"] != (user or {}).get("id"):
            return _err("forbidden", 403)
        history = db.fetchall(
            "SELECT * FROM order_history WHERE order_id = %s ORDER BY id", (order["id"],))
        game = db.fetchone("SELECT * FROM games WHERE id = %s", (order["game_id"],))
        return jsonify({"ok": True, "order": order, "history": history, "game": game})

    @app.post("/api/orders/<code>/receipt")
    def api_upload_receipt(code: str):
        user, err = _require_user()
        if err:
            return err
        order = db.fetchone("SELECT * FROM orders WHERE order_code = %s", (code,))
        if not order or order["user_id"] != user["id"]:
            return _err("not_found", 404)
        if order["status"] in ("completed", "cancelled"):
            return _err("order_closed")
        file = request.files.get("receipt")
        problem = _validate_image(file)
        if problem:
            return _err(f"upload_{problem}")
        url = _save_upload(file, Config.RECEIPT_DIR, code.replace("-", "").lower())
        db.execute("UPDATE orders SET receipt_url = %s, updated_at = %s WHERE id = %s",
                   (url, db.now_str(), order["id"]))
        _add_history(order["id"], order["status"], order["status"], "user", "Receipt uploaded")
        order = db.fetchone("SELECT * FROM orders WHERE id = %s", (order["id"],))
        import bot as tg
        tg.notify_admin(
            f"<b>Chek yuklandi / Загружен чек</b>\nID: <b>{code}</b>\n"
            f"Summa: <b>{order['price']} {order['currency']}</b>")
        return jsonify({"ok": True, "order": order})

    # ---------------- profile ----------------
    @app.get("/api/profile")
    def api_get_profile():
        user, err = _require_user()
        if err:
            return err
        stats = db.fetchone(
            "SELECT COUNT(*) AS orders, COALESCE(SUM(CASE WHEN status NOT IN ('cancelled') "
            "THEN price ELSE 0 END),0) AS spent FROM orders WHERE user_id = %s",
            (user["id"],))
        return jsonify({"ok": True, "user": _public_user(user),
                        "orders": stats["orders"], "spent": float(stats["spent"] or 0)})

    @app.put("/api/profile")
    def api_update_profile():
        user, err = _require_user()
        if err:
            return err
        data = request.get_json(silent=True) or {}
        updates, params = [], []
        if "first_name" in data and str(data["first_name"]).strip():
            updates.append("first_name = %s"); params.append(str(data["first_name"]).strip()[:100])
        if "last_name" in data:
            updates.append("last_name = %s"); params.append(str(data["last_name"]).strip()[:100])
        if str(data.get("language", "")) in Config.LANGUAGES:
            updates.append("language = %s"); params.append(data["language"])
        if updates:
            params.append(user["id"])
            db.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = %s", tuple(params))
        user = db.fetchone("SELECT * FROM users WHERE id = %s", (user["id"],))
        return jsonify({"ok": True, "user": _public_user(user)})

    # ================= ADMIN =================
    @app.post("/api/admin/login")
    def admin_login():
        data = request.get_json(silent=True) or {}
        if str(data.get("password", "")) == admin_password_effective():
            session["is_admin"] = True
            return jsonify({"ok": True})
        return _err("bad_password", 401)

    @app.post("/api/admin/logout")
    def admin_logout():
        session.pop("is_admin", None)
        return jsonify({"ok": True})

    @app.get("/api/admin/me")
    def admin_me():
        return jsonify({"ok": True, "is_admin": bool(session.get("is_admin"))})

    @app.get("/api/admin/stats")
    @admin_required
    def admin_stats():
        counts = db.get_dashboard_counts()
        return jsonify({
            "ok": True,
            "counts": counts,
            "daily": db.revenue_series_daily(30),
            "monthly": db.revenue_series_monthly(12),
            "games": db.game_breakdown(),
            "top_packages": db.top_packages(8),
            "recent": db.fetchall(
                "SELECT * FROM orders ORDER BY id DESC LIMIT 8"),
        })

    @app.get("/api/admin/orders")
    @admin_required
    def admin_orders():
        page, per = _page_args()
        conds, params = [], []
        if request.args.get("status") in Config.STATUSES:
            conds.append("o.status = %s"); params.append(request.args["status"])
        if request.args.get("game_id", "").isdigit():
            conds.append("o.game_id = %s"); params.append(int(request.args["game_id"]))
        if request.args.get("q", "").strip():
            q = f"%{request.args['q'].strip()}%"
            conds.append("(o.order_code LIKE %s OR o.game_username LIKE %s "
                        "OR o.first_name LIKE %s OR o.package_name LIKE %s)")
            params.extend([q, q, q, q])
        where = f"WHERE {' AND '.join(conds)}" if conds else ""
        total = db.fetchone(f"SELECT COUNT(*) AS c FROM orders o {where}", tuple(params))["c"]
        rows = db.fetchall(
            f"""SELECT o.*, g.image_url AS game_image FROM orders o
                LEFT JOIN games g ON g.id = o.game_id
                {where} ORDER BY o.id DESC LIMIT %s OFFSET %s""",
            tuple(params) + (per, (page - 1) * per))
        return jsonify({"ok": True, "orders": rows, "total": total,
                        "page": page, "per_page": per})

    @app.get("/api/admin/orders/<int:order_id>")
    @admin_required
    def admin_order_detail(order_id: int):
        order = db.fetchone("SELECT * FROM orders WHERE id = %s", (order_id,))
        if not order:
            return _err("not_found", 404)
        history = db.fetchall(
            "SELECT * FROM order_history WHERE order_id = %s ORDER BY id", (order_id,))
        user = db.fetchone("SELECT * FROM users WHERE id = %s", (order["user_id"],))
        return jsonify({"ok": True, "order": order, "history": history,
                        "user": _public_user(user) if user else None})

    @app.put("/api/admin/orders/<int:order_id>")
    @admin_required
    def admin_order_update(order_id: int):
        order = db.fetchone("SELECT * FROM orders WHERE id = %s", (order_id,))
        if not order:
            return _err("not_found", 404)
        data = request.get_json(silent=True) or {}
        new_status = str(data.get("status", order["status"]))
        if new_status not in Config.STATUSES:
            return _err("bad_status")
        note = str(data.get("admin_note", order.get("admin_note") or ""))[:1000]
        if new_status != order["status"] or note != (order.get("admin_note") or ""):
            db.execute("UPDATE orders SET status = %s, admin_note = %s, updated_at = %s WHERE id = %s",
                       (new_status, note, db.now_str(), order_id))
            _add_history(order_id, order["status"], new_status, "admin",
                         str(data.get("note", "")) or f"Status → {new_status}")
            if new_status != order["status"]:
                import bot as tg
                user = db.fetchone("SELECT * FROM users WHERE id = %s", (order["user_id"],))
                tg.notify_user_status(order["telegram_id"], order["order_code"], new_status,
                                      (user or {}).get("language", "uz"))
        return jsonify({"ok": True,
                        "order": db.fetchone("SELECT * FROM orders WHERE id = %s", (order_id,))})

    @app.get("/api/admin/users")
    @admin_required
    def admin_users():
        page, per = _page_args()
        conds, params = [], []
        if request.args.get("q", "").strip():
            q = f"%{request.args['q'].strip()}%"
            conds.append("(first_name LIKE %s OR last_name LIKE %s OR username LIKE %s "
                        "OR CAST(telegram_id AS CHAR) LIKE %s)")
            params.extend([q, q, q, q])
        where = f"WHERE {' AND '.join(conds)}" if conds else ""
        if db.dialect() == "sqlite" and conds:
            where = where.replace("CAST(telegram_id AS CHAR)", "CAST(telegram_id AS TEXT)")
        total = db.fetchone(f"SELECT COUNT(*) AS c FROM users {where}", tuple(params))["c"]
        rows = db.fetchall(
            f"""SELECT u.*, (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS orders_count,
                             (SELECT COALESCE(SUM(o.price),0) FROM orders o
                              WHERE o.user_id = u.id AND o.status NOT IN ('cancelled')) AS total_spent
                FROM users u {where} ORDER BY u.id DESC LIMIT %s OFFSET %s""",
            tuple(params) + (per, (page - 1) * per))
        for r in rows:
            r["total_spent"] = float(r.get("total_spent") or 0)
        return jsonify({"ok": True, "users": rows, "total": total,
                        "page": page, "per_page": per})

    @app.put("/api/admin/users/<int:user_id>")
    @admin_required
    def admin_user_update(user_id: int):
        data = request.get_json(silent=True) or {}
        updates, params = [], []
        if "is_blocked" in data:
            updates.append("is_blocked = %s"); params.append(1 if data["is_blocked"] else 0)
        if str(data.get("language", "")) in Config.LANGUAGES:
            updates.append("language = %s"); params.append(data["language"])
        if not updates:
            return _err("nothing_to_update")
        params.append(user_id)
        db.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = %s", tuple(params))
        return jsonify({"ok": True,
                        "user": db.fetchone("SELECT * FROM users WHERE id = %s", (user_id,))})

    # ----- games CRUD -----
    @app.get("/api/admin/games")
    @admin_required
    def admin_games_list():
        return jsonify({"ok": True, "games": db.fetchall(
            "SELECT * FROM games ORDER BY sort_order, id")})

    @app.post("/api/admin/games")
    @admin_required
    def admin_game_create():
        data = request.get_json(silent=True) or {}
        code = str(data.get("code", "")).strip().lower()[:32] or \
            f"game_{int(time.time()) % 100000}"
        name = str(data.get("name", "")).strip()[:100] or "New game"
        if db.fetchone("SELECT id FROM games WHERE code = %s", (code,)):
            return _err("code_exists")
        gid = db.execute(
            """INSERT INTO games (code, name, description_uz, description_ru, description_en,
               image_url, currency_name, currency_icon_url, color_from, color_to, is_active, sort_order)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (code, name, str(data.get("description_uz", "")),
             str(data.get("description_ru", "")), str(data.get("description_en", "")),
             str(data.get("image_url", ""))[:255], str(data.get("currency_name", ""))[:50],
             str(data.get("currency_icon_url", ""))[:255],
             str(data.get("color_from", "#38bdf8"))[:16],
             str(data.get("color_to", "#1d4ed8"))[:16],
             1 if data.get("is_active", True) else 0, int(data.get("sort_order", 0) or 0)),
        )
        return jsonify({"ok": True, "game": db.fetchone("SELECT * FROM games WHERE id = %s", (gid,))})

    @app.put("/api/admin/games/<int:game_id>")
    @admin_required
    def admin_game_update(game_id: int):
        data = request.get_json(silent=True) or {}
        allowed = ("name", "description_uz", "description_ru", "description_en",
                   "image_url", "currency_name", "currency_icon_url",
                   "color_from", "color_to", "is_active", "sort_order")
        updates, params = [], []
        for key in allowed:
            if key in data:
                val = data[key]
                if key == "is_active":
                    val = 1 if val else 0
                if key == "sort_order":
                    val = int(val or 0)
                updates.append(f"{key} = %s"); params.append(val)
        if not updates:
            return _err("nothing_to_update")
        params.append(game_id)
        db.execute(f"UPDATE games SET {', '.join(updates)} WHERE id = %s", tuple(params))
        return jsonify({"ok": True,
                        "game": db.fetchone("SELECT * FROM games WHERE id = %s", (game_id,))})

    @app.delete("/api/admin/games/<int:game_id>")
    @admin_required
    def admin_game_delete(game_id: int):
        db.execute("DELETE FROM packages WHERE game_id = %s", (game_id,))
        db.execute("DELETE FROM games WHERE id = %s", (game_id,))
        return jsonify({"ok": True})

    # ----- packages CRUD -----
    @app.get("/api/admin/packages")
    @admin_required
    def admin_packages_list():
        game_id = request.args.get("game_id", "")
        if game_id.isdigit():
            rows = db.fetchall("SELECT * FROM packages WHERE game_id = %s ORDER BY sort_order, price",
                               (int(game_id),))
        else:
            rows = db.fetchall(
                """SELECT p.*, g.name AS game_name FROM packages p
                   LEFT JOIN games g ON g.id = p.game_id ORDER BY p.game_id, p.sort_order, p.price""")
        return jsonify({"ok": True, "packages": rows})

    @app.post("/api/admin/packages")
    @admin_required
    def admin_package_create():
        data = request.get_json(silent=True) or {}
        try:
            game_id = int(data.get("game_id", 0))
            price = float(data.get("price", 0))
        except (TypeError, ValueError):
            return _err("bad_request")
        pid = db.execute(
            """INSERT INTO packages (game_id, name, amount, price, currency, bonus, is_active, sort_order)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
            (game_id, str(data.get("name", "Package"))[:100],
             str(data.get("amount", ""))[:64], price,
             str(data.get("currency", "UZS"))[:8], str(data.get("bonus", ""))[:100],
             1 if data.get("is_active", True) else 0, int(data.get("sort_order", 0) or 0)),
        )
        return jsonify({"ok": True,
                        "package": db.fetchone("SELECT * FROM packages WHERE id = %s", (pid,))})

    @app.put("/api/admin/packages/<int:pkg_id>")
    @admin_required
    def admin_package_update(pkg_id: int):
        data = request.get_json(silent=True) or {}
        allowed = ("game_id", "name", "amount", "price", "currency", "bonus",
                   "is_active", "sort_order")
        updates, params = [], []
        for key in allowed:
            if key in data:
                val = data[key]
                if key == "is_active":
                    val = 1 if val else 0
                if key in ("game_id", "sort_order"):
                    val = int(val or 0)
                if key == "price":
                    val = float(val or 0)
                updates.append(f"{key} = %s"); params.append(val)
        if not updates:
            return _err("nothing_to_update")
        params.append(pkg_id)
        db.execute(f"UPDATE packages SET {', '.join(updates)} WHERE id = %s", tuple(params))
        return jsonify({"ok": True,
                        "package": db.fetchone("SELECT * FROM packages WHERE id = %s", (pkg_id,))})

    @app.delete("/api/admin/packages/<int:pkg_id>")
    @admin_required
    def admin_package_delete(pkg_id: int):
        db.execute("DELETE FROM packages WHERE id = %s", (pkg_id,))
        return jsonify({"ok": True})

    # ----- payment methods CRUD -----
    @app.get("/api/admin/payments")
    @admin_required
    def admin_payments_list():
        return jsonify({"ok": True, "methods": db.fetchall(
            "SELECT * FROM payment_methods ORDER BY sort_order, id")})

    @app.post("/api/admin/payments")
    @admin_required
    def admin_payment_create():
        data = request.get_json(silent=True) or {}
        mid = db.execute(
            """INSERT INTO payment_methods
               (name, details, instructions_uz, instructions_ru, instructions_en, is_active, sort_order)
               VALUES (%s,%s,%s,%s,%s,%s,%s)""",
            (str(data.get("name", "Card"))[:100], str(data.get("details", "")),
             str(data.get("instructions_uz", "")), str(data.get("instructions_ru", "")),
             str(data.get("instructions_en", "")),
             1 if data.get("is_active", True) else 0, int(data.get("sort_order", 0) or 0)),
        )
        return jsonify({"ok": True, "method": db.fetchone(
            "SELECT * FROM payment_methods WHERE id = %s", (mid,))})

    @app.put("/api/admin/payments/<int:mid>")
    @admin_required
    def admin_payment_update(mid: int):
        data = request.get_json(silent=True) or {}
        allowed = ("name", "details", "instructions_uz", "instructions_ru",
                   "instructions_en", "is_active", "sort_order")
        updates, params = [], []
        for key in allowed:
            if key in data:
                val = 1 if (key == "is_active" and data[key]) else data[key]
                if key == "is_active":
                    val = 1 if data[key] else 0
                if key == "sort_order":
                    val = int(val or 0)
                updates.append(f"{key} = %s"); params.append(val)
        if not updates:
            return _err("nothing_to_update")
        params.append(mid)
        db.execute(f"UPDATE payment_methods SET {', '.join(updates)} WHERE id = %s", tuple(params))
        return jsonify({"ok": True, "method": db.fetchone(
            "SELECT * FROM payment_methods WHERE id = %s", (mid,))})

    @app.delete("/api/admin/payments/<int:mid>")
    @admin_required
    def admin_payment_delete(mid: int):
        db.execute("DELETE FROM payment_methods WHERE id = %s", (mid,))
        return jsonify({"ok": True})

    # ----- settings -----
    _SETTING_KEYS = ("app_name", "app_tagline_uz", "app_tagline_ru", "app_tagline_en",
                     "logo_url", "hero_banner_url", "support_username",
                     "support_text_uz", "support_text_ru", "support_text_en",
                     "default_lang", "theme_primary", "theme_accent",
                     "announcement_uz", "announcement_ru", "announcement_en",
                     "admin_password")

    @app.get("/api/admin/settings")
    @admin_required
    def admin_settings_get():
        return jsonify({"ok": True, "settings": db.get_all_settings()})

    @app.put("/api/admin/settings")
    @admin_required
    def admin_settings_put():
        data = request.get_json(silent=True) or {}
        for key in _SETTING_KEYS:
            if key in data and data[key] is not None:
                db.set_setting(key, str(data[key])[:2000])
        return jsonify({"ok": True, "settings": db.get_all_settings()})

    # ----- uploads -----
    @app.post("/api/admin/upload")
    @admin_required
    def admin_upload():
        target = request.args.get("target", "games")
        folder = {"games": Config.GAME_IMG_DIR, "logos": Config.LOGO_DIR,
                  "receipts": Config.RECEIPT_DIR}.get(target, Config.GAME_IMG_DIR)
        file = request.files.get("file")
        problem = _validate_image(file)
        if problem:
            return _err(f"upload_{problem}")
        return jsonify({"ok": True, "url": _save_upload(file, folder, target)})

    # ---------------- errors ----------------
    @app.errorhandler(413)
    def _too_large(_):
        return _err("upload_bad_size", 413)

    @app.errorhandler(404)
    def _nf(_):
        if request.path.startswith("/api/"):
            return _err("not_found", 404)
        return render_template("index.html")
