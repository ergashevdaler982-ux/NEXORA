"""NEXORA database layer.

Primary engine: MySQL (mysql-connector-python).
Automatic fallback: SQLite (same schema, zero config) so `python main.py`
always boots even without a MySQL server.

All SQL is written with %s placeholders and translated to ? for SQLite.
"""
from __future__ import annotations

import logging
import sqlite3
import threading
from datetime import date, datetime, timedelta
from decimal import Decimal

from config import Config

try:
    import mysql.connector as _mysql_driver
except Exception:  # pragma: no cover - driver missing
    _mysql_driver = None

log = logging.getLogger("nexora.db")
_lock = threading.RLock()


# ---------------------------------------------------------------- helpers
def dialect() -> str:
    """Return 'mysql' when a MySQL server is configured, else 'sqlite'."""
    if _mysql_driver is not None and Config.MYSQL_HOST:
        return "mysql"
    return "sqlite"


def _prepare(sql: str) -> str:
    if dialect() == "sqlite":
        return sql.replace("%s", "?")
    return sql


def _connect():
    if dialect() == "mysql":
        return _mysql_driver.connect(
            host=Config.MYSQL_HOST,
            port=Config.MYSQL_PORT,
            user=Config.MYSQL_USER,
            password=Config.MYSQL_PASSWORD,
            database=Config.MYSQL_DB,
            charset="utf8mb4",
            autocommit=False,
        )
    conn = sqlite3.connect(Config.SQLITE_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def _norm(value):
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, (datetime, date)):
        return value.strftime("%Y-%m-%d %H:%M:%S") if isinstance(value, datetime) else value.isoformat()
    if isinstance(value, (bytes, bytearray)):
        try:
            return bytes(value).decode("utf-8")
        except Exception:
            return str(value)
    return value


def _rows_to_dicts(rows) -> list[dict]:
    return [{k: _norm(v) for k, v in dict(r).items()} for r in rows]


def fetchall(sql: str, params: tuple = ()) -> list[dict]:
    with _lock:
        conn = _connect()
        try:
            if dialect() == "mysql":
                cur = conn.cursor(dictionary=True)
                cur.execute(sql, params or None)
                return _rows_to_dicts(cur.fetchall())
            cur = conn.cursor()
            cur.execute(_prepare(sql), params or ())
            return _rows_to_dicts(cur.fetchall())
        finally:
            conn.close()


def fetchone(sql: str, params: tuple = ()) -> dict | None:
    rows = fetchall(sql, params)
    return rows[0] if rows else None


def execute(sql: str, params: tuple = ()) -> int:
    """Run INSERT/UPDATE/DELETE. Returns lastrowid (or 0)."""
    with _lock:
        conn = _connect()
        try:
            cur = conn.cursor()
            if dialect() == "mysql":
                cur.execute(sql, params or None)
            else:
                cur.execute(_prepare(sql), params or ())
            conn.commit()
            return cur.lastrowid or 0
        except Exception:
            try:
                conn.rollback()
            except Exception:
                pass
            raise
        finally:
            conn.close()


def now_str() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


# ---------------------------------------------------------------- schema
_SCHEMA_MYSQL = [
    """CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        telegram_id BIGINT NOT NULL UNIQUE,
        first_name VARCHAR(100) DEFAULT '',
        last_name VARCHAR(100) DEFAULT '',
        username VARCHAR(100) DEFAULT '',
        language VARCHAR(8) DEFAULT 'uz',
        is_blocked TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",
    """CREATE TABLE IF NOT EXISTS games (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(32) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        description_uz TEXT DEFAULT '',
        description_ru TEXT DEFAULT '',
        description_en TEXT DEFAULT '',
        image_url VARCHAR(255) DEFAULT '',
        currency_name VARCHAR(50) DEFAULT '',
        currency_icon_url VARCHAR(255) DEFAULT '',
        color_from VARCHAR(16) DEFAULT '#38bdf8',
        color_to VARCHAR(16) DEFAULT '#1d4ed8',
        is_active TINYINT(1) DEFAULT 1,
        sort_order INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",
    """CREATE TABLE IF NOT EXISTS packages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        game_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        amount VARCHAR(64) DEFAULT '',
        price DECIMAL(12,2) DEFAULT 0,
        currency VARCHAR(8) DEFAULT 'UZS',
        bonus VARCHAR(100) DEFAULT '',
        is_active TINYINT(1) DEFAULT 1,
        sort_order INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_pkg_game (game_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",
    """CREATE TABLE IF NOT EXISTS payment_methods (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        details TEXT DEFAULT '',
        instructions_uz TEXT DEFAULT '',
        instructions_ru TEXT DEFAULT '',
        instructions_en TEXT DEFAULT '',
        is_active TINYINT(1) DEFAULT 1,
        sort_order INT DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",
    """CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_code VARCHAR(16) NOT NULL UNIQUE,
        user_id INT NOT NULL,
        telegram_id BIGINT NOT NULL,
        game_id INT NOT NULL,
        package_id INT NOT NULL,
        game_name VARCHAR(100) DEFAULT '',
        package_name VARCHAR(100) DEFAULT '',
        package_amount VARCHAR(64) DEFAULT '',
        price DECIMAL(12,2) DEFAULT 0,
        currency VARCHAR(8) DEFAULT 'UZS',
        first_name VARCHAR(100) DEFAULT '',
        last_name VARCHAR(100) DEFAULT '',
        game_username VARCHAR(150) DEFAULT '',
        receipt_url VARCHAR(255) DEFAULT '',
        status VARCHAR(16) DEFAULT 'pending',
        admin_note TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ord_user (user_id),
        INDEX idx_ord_tg (telegram_id),
        INDEX idx_ord_status (status),
        INDEX idx_ord_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",
    """CREATE TABLE IF NOT EXISTS order_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        old_status VARCHAR(16) DEFAULT '',
        new_status VARCHAR(16) DEFAULT '',
        changed_by VARCHAR(50) DEFAULT 'system',
        note TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_hist_order (order_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",
    """CREATE TABLE IF NOT EXISTS settings (
        skey VARCHAR(64) PRIMARY KEY,
        svalue TEXT DEFAULT ''
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",
    """CREATE TABLE IF NOT EXISTS hamyon_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        order_code VARCHAR(16) NOT NULL,
        payment_id VARCHAR(64) NOT NULL UNIQUE,
        shop_id VARCHAR(64) DEFAULT '',
        amount DECIMAL(12,2) DEFAULT 0,
        requested_amount DECIMAL(12,2) DEFAULT 0,
        card VARCHAR(32) DEFAULT '',
        status VARCHAR(16) DEFAULT 'pending',
        expires_at DATETIME DEFAULT NULL,
        raw_response TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_hamyon_order (order_id),
        INDEX idx_hamyon_code (order_code),
        INDEX idx_hamyon_status (status),
        INDEX idx_hamyon_payid (payment_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",
]

_SCHEMA_SQLITE = [
    """CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id INTEGER NOT NULL UNIQUE,
        first_name VARCHAR(100) DEFAULT '',
        last_name VARCHAR(100) DEFAULT '',
        username VARCHAR(100) DEFAULT '',
        language VARCHAR(8) DEFAULT 'uz',
        is_blocked INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
    )""",
    """CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code VARCHAR(32) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        description_uz TEXT DEFAULT '',
        description_ru TEXT DEFAULT '',
        description_en TEXT DEFAULT '',
        image_url VARCHAR(255) DEFAULT '',
        currency_name VARCHAR(50) DEFAULT '',
        currency_icon_url VARCHAR(255) DEFAULT '',
        color_from VARCHAR(16) DEFAULT '#38bdf8',
        color_to VARCHAR(16) DEFAULT '#1d4ed8',
        is_active INTEGER DEFAULT 1,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )""",
    """CREATE TABLE IF NOT EXISTS packages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER NOT NULL,
        name VARCHAR(100) NOT NULL,
        amount VARCHAR(64) DEFAULT '',
        price NUMERIC DEFAULT 0,
        currency VARCHAR(8) DEFAULT 'UZS',
        bonus VARCHAR(100) DEFAULT '',
        is_active INTEGER DEFAULT 1,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )""",
    """CREATE TABLE IF NOT EXISTS payment_methods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        details TEXT DEFAULT '',
        instructions_uz TEXT DEFAULT '',
        instructions_ru TEXT DEFAULT '',
        instructions_en TEXT DEFAULT '',
        is_active INTEGER DEFAULT 1,
        sort_order INTEGER DEFAULT 0
    )""",
    """CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_code VARCHAR(16) NOT NULL UNIQUE,
        user_id INTEGER NOT NULL,
        telegram_id INTEGER NOT NULL,
        game_id INTEGER NOT NULL,
        package_id INTEGER NOT NULL,
        game_name VARCHAR(100) DEFAULT '',
        package_name VARCHAR(100) DEFAULT '',
        package_amount VARCHAR(64) DEFAULT '',
        price NUMERIC DEFAULT 0,
        currency VARCHAR(8) DEFAULT 'UZS',
        first_name VARCHAR(100) DEFAULT '',
        last_name VARCHAR(100) DEFAULT '',
        game_username VARCHAR(150) DEFAULT '',
        receipt_url VARCHAR(255) DEFAULT '',
        status VARCHAR(16) DEFAULT 'pending',
        admin_note TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )""",
    """CREATE TABLE IF NOT EXISTS order_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        old_status VARCHAR(16) DEFAULT '',
        new_status VARCHAR(16) DEFAULT '',
        changed_by VARCHAR(50) DEFAULT 'system',
        note TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )""",
    """CREATE TABLE IF NOT EXISTS settings (
        skey VARCHAR(64) PRIMARY KEY,
        svalue TEXT DEFAULT ''
    )""",
    """CREATE TABLE IF NOT EXISTS hamyon_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        order_code VARCHAR(16) NOT NULL,
        payment_id VARCHAR(64) NOT NULL UNIQUE,
        shop_id VARCHAR(64) DEFAULT '',
        amount NUMERIC DEFAULT 0,
        requested_amount NUMERIC DEFAULT 0,
        card VARCHAR(32) DEFAULT '',
        status VARCHAR(16) DEFAULT 'pending',
        expires_at DATETIME DEFAULT NULL,
        raw_response TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )""",
    "CREATE INDEX IF NOT EXISTS idx_pkg_game ON packages (game_id)",
    "CREATE INDEX IF NOT EXISTS idx_ord_user ON orders (user_id)",
    "CREATE INDEX IF NOT EXISTS idx_ord_tg ON orders (telegram_id)",
    "CREATE INDEX IF NOT EXISTS idx_ord_status ON orders (status)",
    "CREATE INDEX IF NOT EXISTS idx_ord_created ON orders (created_at)",
    "CREATE INDEX IF NOT EXISTS idx_hist_order ON order_history (order_id)",
    "CREATE INDEX IF NOT EXISTS idx_hamyon_order ON hamyon_payments (order_id)",
    "CREATE INDEX IF NOT EXISTS idx_hamyon_code ON hamyon_payments (order_code)",
    "CREATE INDEX IF NOT EXISTS idx_hamyon_status ON hamyon_payments (status)",
    "CREATE INDEX IF NOT EXISTS idx_hamyon_payid ON hamyon_payments (payment_id)",
]


def _ensure_mysql_database() -> None:
    """Create the MySQL database itself if it does not exist yet."""
    conn = _mysql_driver.connect(
        host=Config.MYSQL_HOST,
        port=Config.MYSQL_PORT,
        user=Config.MYSQL_USER,
        password=Config.MYSQL_PASSWORD,
        charset="utf8mb4",
    )
    try:
        cur = conn.cursor()
        cur.execute(
            f"CREATE DATABASE IF NOT EXISTS `{Config.MYSQL_DB}` "
            "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        )
        conn.commit()
    finally:
        conn.close()


def init_db() -> str:
    """Create tables. Returns the active dialect ('mysql'/'sqlite')."""
    if dialect() == "mysql":
        try:
            _ensure_mysql_database()
        except Exception as exc:  # pragma: no cover
            log.error("MySQL init failed (%s); falling back to SQLite.", exc)
            Config.MYSQL_HOST = ""
    stmts = _SCHEMA_MYSQL if dialect() == "mysql" else _SCHEMA_SQLITE
    for stmt in stmts:
        execute(stmt)
    log.info("Database ready (dialect=%s).", dialect())
    return dialect()


# ---------------------------------------------------------------- settings
def get_setting(key: str, default: str = "") -> str:
    row = fetchone("SELECT svalue FROM settings WHERE skey = %s", (key,))
    if row is None or row.get("svalue") is None:
        return default
    return str(row["svalue"])


def set_setting(key: str, value: str) -> None:
    if dialect() == "mysql":
        execute(
            "INSERT INTO settings (skey, svalue) VALUES (%s, %s) "
            "ON DUPLICATE KEY UPDATE svalue = VALUES(svalue)",
            (key, str(value)),
        )
    else:
        execute("INSERT OR REPLACE INTO settings (skey, svalue) VALUES (%s, %s)", (key, str(value)))


def get_all_settings() -> dict:
    return {r["skey"]: r["svalue"] for r in fetchall("SELECT skey, svalue FROM settings")}


# ---------------------------------------------------------------- seed
_DEFAULT_SETTINGS = {
    "app_name": "NEXORA",
    "app_tagline_uz": "O'yin donatlari — tez, xavfsiz, ishonchli",
    "app_tagline_ru": "Донат для игр — быстро и безопасно",
    "app_tagline_en": "Game top-up — fast, safe, reliable",
    "logo_url": "",
    "hero_banner_url": "",
    "support_username": "nexora_support",
    "support_text_uz": "Savollaringiz bo'lsa yozing — tez javob beramiz!",
    "support_text_ru": "Остались вопросы? Напишите нам — ответим быстро!",
    "support_text_en": "Questions? Message us — we reply fast!",
    "default_lang": "uz",
    "theme_primary": "#1d4ed8",
    "theme_accent": "#38bdf8",
    "announcement_uz": "",
    "announcement_ru": "",
    "announcement_en": "",
    "admin_password": "",
    # Hamyon API
    "hamyon_enabled": "0",
    "hamyon_shop_id": "",
    "hamyon_shop_key": "",
    "hamyon_auto_complete": "1",
    "hamyon_card_name": "HUMO/UZCARD",
}

_SEED_GAMES = [
    {
        "code": "roblox", "name": "Roblox",
        "description_uz": "Robux va eksklyuziv paketlar",
        "description_ru": "Робуксы и эксклюзивные пакеты",
        "description_en": "Robux and exclusive bundles",
        "image_url": "/static/img/game-roblox.jpg",
        "currency_name": "Robux",
        "currency_icon_url": "",
        "color_from": "#38bdf8", "color_to": "#1d4ed8",
    },
    {
        "code": "pubg", "name": "PUBG Mobile",
        "description_uz": "UC — Unknown Cash paketlari",
        "description_ru": "UC — пакеты Unknown Cash",
        "description_en": "UC — Unknown Cash packs",
        "image_url": "/static/img/game-pubg.jpg",
        "currency_name": "UC",
        "currency_icon_url": "",
        "color_from": "#7dd3fc", "color_to": "#0c4a6e",
    },
    {
        "code": "easports", "name": "EA Sports FC",
        "description_uz": "FC Points paketlari",
        "description_ru": "Пакеты FC Points",
        "description_en": "FC Points packs",
        "image_url": "/static/img/game-easports.jpg",
        "currency_name": "FC Points",
        "currency_icon_url": "",
        "color_from": "#60a5fa", "color_to": "#172554",
    },
]

_SEED_PACKAGES = {
    "roblox": [
        ("Starter", "80 Robux", 15000, ""),
        ("Popular", "400 Robux", 70000, "Mashhur"),
        ("Pro", "800 Robux", 135000, ""),
        ("Epic", "1700 Robux", 270000, "+5% bonus"),
        ("Legend", "4500 Robux", 650000, "+10% bonus"),
    ],
    "pubg": [
        ("Mini", "60 UC", 15000, ""),
        ("Popular", "325 UC", 70000, "Mashhur"),
        ("Pro", "660 UC", 140000, ""),
        ("Epic", "1800 UC", 350000, "+8% bonus"),
        ("Legend", "3850 UC", 700000, "+12% bonus"),
    ],
    "easports": [
        ("Starter", "100 FC Points", 30000, ""),
        ("Popular", "520 FC Points", 140000, "Mashhur"),
        ("Pro", "1050 FC Points", 270000, ""),
        ("Epic", "2150 FC Points", 520000, "+5% bonus"),
        ("Legend", "5750 FC Points", 1300000, "+10% bonus"),
    ],
}

_SEED_PAYMENTS = [
    {
        "name": "Click",
        "details": "8600 0000 0000 0000\nNEXORA",
        "instructions_uz": "1. Summani kartaga o'tkazing.\n2. Chek skrinshotini saqlang.\n3. Skrinshotni shu yerda yuklang.",
        "instructions_ru": "1. Переведите сумму на карту.\n2. Сохраните скриншот чека.\n3. Загрузите скриншот здесь.",
        "instructions_en": "1. Transfer the amount to the card.\n2. Save the receipt screenshot.\n3. Upload the screenshot here.",
    },
    {
        "name": "Payme",
        "details": "8600 0000 0000 0000\nNEXORA",
        "instructions_uz": "1. Summani kartaga o'tkazing.\n2. Chek skrinshotini saqlang.\n3. Skrinshotni shu yerda yuklang.",
        "instructions_ru": "1. Переведите сумму на карту.\n2. Сохраните скриншот чека.\n3. Загрузите скриншот здесь.",
        "instructions_en": "1. Transfer the amount to the card.\n2. Save the receipt screenshot.\n3. Upload the screenshot here.",
    },
]


def seed_db() -> None:
    """Insert default settings, games, packages and payment methods."""
    for key, val in _DEFAULT_SETTINGS.items():
        if fetchone("SELECT skey FROM settings WHERE skey = %s", (key,)) is None:
            set_setting(key, val)

    if fetchone("SELECT id FROM games LIMIT 1") is None:
        for order, game in enumerate(_SEED_GAMES):
            gid = execute(
                """INSERT INTO games
                   (code, name, description_uz, description_ru, description_en,
                    image_url, currency_name, currency_icon_url,
                    color_from, color_to, is_active, sort_order)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,1,%s)""",
                (game["code"], game["name"], game["description_uz"],
                 game["description_ru"], game["description_en"], game["image_url"],
                 game["currency_name"], game["currency_icon_url"],
                 game["color_from"], game["color_to"], order),
            )
            for i, (name, amount, price, bonus) in enumerate(_SEED_PACKAGES[game["code"]]):
                execute(
                    """INSERT INTO packages
                       (game_id, name, amount, price, currency, bonus, is_active, sort_order)
                       VALUES (%s,%s,%s,%s,'UZS',%s,1,%s)""",
                    (gid, name, amount, price, bonus, i),
                )

    if fetchone("SELECT id FROM payment_methods LIMIT 1") is None:
        for i, pm in enumerate(_SEED_PAYMENTS):
            execute(
                """INSERT INTO payment_methods
                   (name, details, instructions_uz, instructions_ru, instructions_en, is_active, sort_order)
                   VALUES (%s,%s,%s,%s,%s,1,%s)""",
                (pm["name"], pm["details"], pm["instructions_uz"],
                 pm["instructions_ru"], pm["instructions_en"], i),
            )
    log.info("Seed data ensured.")


# ---------------------------------------------------------------- statistics
def _revenue_case() -> str:
    stati = ",".join(f"'{s}'" for s in Config.REVENUE_STATUSES)
    return f"CASE WHEN status IN ({stati}) THEN price ELSE 0 END"


def get_dashboard_counts() -> dict:
    users = fetchone("SELECT COUNT(*) AS c FROM users")["c"]
    orders = fetchone("SELECT COUNT(*) AS c FROM orders")["c"]
    by_status = {r["status"]: r["c"] for r in fetchall(
        "SELECT status, COUNT(*) AS c FROM orders GROUP BY status")}
    revenue = fetchone(f"SELECT COALESCE(SUM({_revenue_case()}),0) AS s FROM orders")["s"]
    today = date.today().isoformat()
    if dialect() == "mysql":
        today_orders = fetchone(
            "SELECT COUNT(*) AS c FROM orders WHERE DATE(created_at) = %s", (today,))["c"]
        today_rev = fetchone(
            f"SELECT COALESCE(SUM({_revenue_case()}),0) AS s FROM orders "
            "WHERE DATE(created_at) = %s", (today,))["s"]
        new_users = fetchone(
            "SELECT COUNT(*) AS c FROM users WHERE DATE(created_at) = %s", (today,))["c"]
    else:
        today_orders = fetchone(
            "SELECT COUNT(*) AS c FROM orders WHERE date(created_at) = %s", (today,))["c"]
        today_rev = fetchone(
            f"SELECT COALESCE(SUM({_revenue_case()}),0) AS s FROM orders "
            "WHERE date(created_at) = %s", (today,))["s"]
        new_users = fetchone(
            "SELECT COUNT(*) AS c FROM users WHERE date(created_at) = %s", (today,))["c"]
    return {
        "users": users,
        "orders": orders,
        "revenue": float(revenue or 0),
        "today_orders": today_orders,
        "today_revenue": float(today_rev or 0),
        "today_users": new_users,
        "by_status": {s: int(by_status.get(s, 0)) for s in Config.STATUSES},
    }


def revenue_series_daily(days: int = 30) -> list[dict]:
    cutoff = (date.today() - timedelta(days=days - 1)).isoformat()
    if dialect() == "mysql":
        rows = fetchall(
            f"""SELECT DATE(created_at) AS d, COUNT(*) AS orders,
                       COALESCE(SUM({_revenue_case()}),0) AS revenue
                FROM orders WHERE DATE(created_at) >= %s
                GROUP BY d ORDER BY d""",
            (cutoff,),
        )
    else:
        rows = fetchall(
            f"""SELECT date(created_at) AS d, COUNT(*) AS orders,
                       COALESCE(SUM({_revenue_case()}),0) AS revenue
                FROM orders WHERE date(created_at) >= %s
                GROUP BY d ORDER BY d""",
            (cutoff,),
        )
    by_day = {str(r["d"])[:10]: r for r in rows}
    out: list[dict] = []
    for i in range(days):
        d = (date.today() - timedelta(days=days - 1 - i)).isoformat()
        r = by_day.get(d, {})
        out.append({"date": d, "orders": int(r.get("orders", 0)),
                    "revenue": float(r.get("revenue", 0))})
    return out


def revenue_series_monthly(months: int = 12) -> list[dict]:
    if dialect() == "mysql":
        rows = fetchall(
            f"""SELECT DATE_FORMAT(created_at,'%Y-%m') AS m, COUNT(*) AS orders,
                       COALESCE(SUM({_revenue_case()}),0) AS revenue
                FROM orders WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL {int(months)} MONTH)
                GROUP BY m ORDER BY m"""
        )
    else:
        rows = fetchall(
            f"""SELECT strftime('%Y-%m', created_at) AS m, COUNT(*) AS orders,
                       COALESCE(SUM({_revenue_case()}),0) AS revenue
                FROM orders WHERE date(created_at) >= date('now', '-{int(months)} months')
                GROUP BY m ORDER BY m"""
        )
    by_m = {r["m"]: r for r in rows}
    out: list[dict] = []
    y, m = date.today().year, date.today().month
    keys: list[str] = []
    for _ in range(months):
        keys.append(f"{y:04d}-{m:02d}")
        m -= 1
        if m == 0:
            m, y = 12, y - 1
    for k in reversed(keys):
        r = by_m.get(k, {})
        out.append({"month": k, "orders": int(r.get("orders", 0)),
                    "revenue": float(r.get("revenue", 0))})
    return out


def game_breakdown() -> list[dict]:
    return [
        {"game_id": r["game_id"], "game_name": r["game_name"],
         "orders": int(r["orders"]), "revenue": float(r["revenue"])}
        for r in fetchall(
            f"""SELECT game_id, game_name, COUNT(*) AS orders,
                       COALESCE(SUM({_revenue_case()}),0) AS revenue
                FROM orders GROUP BY game_id, game_name ORDER BY revenue DESC"""
        )
    ]


def top_packages(limit: int = 8) -> list[dict]:
    return [
        {"package_name": r["package_name"], "game_name": r["game_name"],
         "orders": int(r["orders"]), "revenue": float(r["revenue"])}
        for r in fetchall(
            f"""SELECT package_name, game_name, COUNT(*) AS orders,
                       COALESCE(SUM({_revenue_case()}),0) AS revenue
                FROM orders GROUP BY package_id, package_name, game_name
                ORDER BY orders DESC LIMIT {int(limit)}"""
        )
    ]
