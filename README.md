# NEXORA — Soft UI Gaming Donation Platform

Professional Telegram WebApp shop for **Roblox (Robux)**, **PUBG Mobile (UC)** and **EA Sports FC (FC Points)**:
user shop + admin panel + Telegram bot — everything starts with **one command**.

> Faqat `python main.py` ni ishga tushiring — WebApp, admin panel va bot birga yonadi.

---

## Features

**User WebApp (`/`)**
- Game catalog with cover art + animated currency coins (Robux / UC / FC)
- Package shop: name, amount, price, Buy button
- Registration: first name, last name, Player ID / nickname — **passwords are never asked, shown or stored**
- Payment flow: amount → admin payment details → pay → upload receipt screenshot → admin verification → done
- My Orders with full status history (Pending / Paid / Processing / Completed / Cancelled)
- Profile (stats, name edit) + Support page
- Soft UI: dark-blue + light-blue, **Night/Day themes**, mobile-first, smooth animations
- **3 languages**: O'zbek / Русский / English
- Animated SVG icons everywhere (no static emoji)

**Admin panel (`/admin`)**
- Dashboard: users, orders, revenue, pending/paid/processing/completed/cancelled
- Charts: daily revenue (30 days), monthly revenue (12 months), per-game doughnut, status doughnut, top packages
- Orders: search/filter, receipt viewer, manual status change, admin note (user gets Telegram notification)
- Users: search, order stats, block/unblock
- Games: add/edit/remove, cover upload, currency name + icon, colors, descriptions (3 langs)
- Packages: add/edit/remove, price change
- Payment methods: cards/requisites + instructions (3 langs)
- Settings: app name, taglines, **logo/banner upload**, support username, theme colors, announcements, admin password change

**Bot** — only `/start` (+ `/help`): shows a WebApp launch button + sends order notifications.

**Database** — MySQL (primary). If `MYSQL_HOST` is empty/unreachable, SQLite fallback starts automatically so the project always boots.

---

## Quick start

```bash
cd NEXORA
python -m venv .venv && source .venv/bin/activate   # ixtiyoriy
pip install -r requirements.txt

cp .env.example .env
# .env ni tahrirlang: BOT_TOKEN, WEBAPP_URL (https), ADMIN_PASSWORD, MySQL...

python main.py
```

Open:
- WebApp: `http://localhost:5000/` (yoki `WEBAPP_URL`)
- Admin: `http://localhost:5000/admin` (default password: `admin123`)

> Telegram WebApp uchun `WEBAPP_URL` **HTTPS** bo'lishi shart (BotFather → Bot Settings → Menu Button / Web App URL).

## BotFather setup

1. [@BotFather](https://t.me/BotFather) → `/newbot` → tokenni `.env` → `BOT_TOKEN` ga qo'ying
2. `/mybots` → Bot Settings → Menu Button → `WEBAPP_URL` ni kiriting (https)
3. `python main.py` → botda `/start` bosing → WebApp tugmasi chiqadi

## MySQL setup

```sql
CREATE DATABASE nexora CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'nexora'@'%' IDENTIFIED BY 'strong-password';
GRANT ALL PRIVILEGES ON nexora.* TO 'nexora'@'%';
FLUSH PRIVILEGES;
```

`.env`:
```
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=nexora
MYSQL_PASSWORD=strong-password
MYSQL_DB=nexora
```

Jadvallar avtomatik yaratiladi (`init_db`), boshlang'ich o'yinlar/paketlar/to'lovlar avtomatik to'ldiriladi (`seed_db`). MySQL bo'lmasa — SQLite (`nexora.db`) ishlaydi.

## Project structure

```
NEXORA/
├── main.py              # ← RUN THIS: web server + bot polling
├── app.py               # Flask: pages + REST API (user + admin)
├── bot.py               # Telegram bot (/start → WebApp button, notifications)
├── database.py          # MySQL + SQLite fallback, schema, seed, statistics
├── config.py            # .env configuration
├── templates/           # index.html (WebApp), admin.html (panel)
├── static/css/          # app.css, admin.css (Soft UI, night/day)
├── static/js/           # app.js, admin.js (UZ/RU/EN, charts)
├── static/img/          # game cover art
└── uploads/             # receipts, game images, logos (auto-created)
```

## Security notes

- Game passwords are **never** requested, displayed or stored — only public Player ID / nickname.
- Admin panel is password-protected (session auth, changeable from the panel).
- Telegram `initData` is HMAC-verified on every auth.
- Receipt uploads validated: extension, magic bytes, size limit.
- Every order gets a unique `NX-XXXXXX` code + full status history.

## API cheat sheet

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth` | WebApp auth (initData) |
| GET | `/api/games`, `/api/games/<id>` | Catalog |
| POST | `/api/orders` | Create order |
| GET | `/api/orders/mine` | My orders |
| POST | `/api/orders/<code>/receipt` | Upload receipt |
| GET/PUT | `/api/profile` | Profile |
| POST | `/api/admin/login` | Admin login |
| GET | `/api/admin/stats` | Dashboard + charts data |
| GET/PUT | `/api/admin/orders…` | Order management |
| CRUD | `/api/admin/games|packages|payments` | Catalog management |
| GET/PUT | `/api/admin/settings` | All settings |
| POST | `/api/admin/upload?target=` | Image upload |

---
Made with Soft UI • Dark blue + Light blue • NEXORA
