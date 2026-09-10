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
- Dashboard: users, orders, revenue, pending/paid/processing/completed/cancelled + **Hamyon stats**
- Charts: daily revenue (30 days), monthly revenue (12 months), per-game doughnut, status doughnut, top packages
- Orders: search/filter, receipt viewer, manual status change, admin note (user gets Telegram notification) + Hamyon card/status badge
- Users: search, order stats, block/unblock
- Games: add/edit/remove, cover upload, currency name + icon, colors, descriptions (3 langs)
- Packages: add/edit/remove, price change
- Payment methods: cards/requisites + instructions (3 langs)
- **Hamyon API (`/admin` → Hamyon API)**: shop_id / shop_key sozlash, enabled toggle, auto-complete, webhook URLs (prepare/complete), test payment, barcha hamyon tranzaksiyalar tarixi, karta va summa ko‘rish
- Settings: app name, taglines, **logo/banner upload**, support username, theme colors, announcements, admin password change + Hamyon keys

**Hamyon API (hamyon-api.uz)**
- HUMO va UZCARD kartalariga tushgan to‘lovni 5-30s ichida avtomatik aniqlaydi
- Foydalanuvchi buyurtma yaratganda “Avto to‘lov” tugmasi chiqadi → karta + aniq summa + 5 daqiqalik timer
- Pul tushishi bilan `complete_url` ga `paid` webhook keladi, NEXORA buyurtmani avtomatik `paid` qiladi va Telegram orqali mijozga xabar yuboradi
- Bir xil summadagi ochiq to‘lovlar to‘qnashmasligi uchun summa avtomatik 1-9 so‘mga o‘zgartiriladi (mijoz sezmaydi)
- Callback imzosi `md5(shop_id + payment_id + amount + shop_key)` bilan tekshiriladi
- Manual to‘lov usullari ham ishlayveradi (fallback)

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

## Hamyon API integratsiya (qisqa qo‘llanma)

1. Telegram da [@HamyonAPIBot](https://t.me/HamyonAPIBot) ni oching → `/start` → `shop_id` va `shop_key` oling
2. `@HumoCardBot` (HUMO) yoki `@CardXabarBot` (UZCARD) orqali karta xabarnomalaringizni Hamyon ga ulang
3. NEXORA admin panel → **Hamyon API** bo‘limiga kiring:
   - `Shop ID` va `Shop Key` ni kiriting
   - `Hamyon yoqilgan` ni yoqing, `Avto tasdiqlash` ni yoqing
   - Saqlang
4. Shu bo‘limda ko‘rsatilgan **Complete URL** ni nusxalab, `@HamyonAPIBot` → Do‘kon sozlamalari → `complete_url` ga qo‘ying
   - `prepare_url` ham bir xil bo‘lishi mumkin: `https://SIZNING_DOMEN/api/hamyon/callback/prepare`
   - `complete_url`: `https://SIZNING_DOMEN/api/hamyon/callback/complete`
   - Yagona webhook ham mavjud: `https://SIZNING_DOMEN/api/hamyon/webhook`
5. **Test to‘lov** tugmasini bosing — 1000 so‘mlik test to‘lov yaratiladi va darhol bekor qilinadi. Agar OK bo‘lsa, API ishlayapti.
6. Foydalanuvchi WebApp da buyurtma yaratganda “Avto to‘lov (Hamyon)” varianti chiqadi, karta va aniq summa ko‘rinadi, 5 daqiqa ichida to‘lashi kerak. To‘lov tushishi bilan buyurtma avtomatik `paid` bo‘ladi.

> **Muhim:** Bir vaqtda bir xil summadagi 2 ta ochiq to‘lov bo‘lishi mumkin emas (summa bo‘yicha aniqlanadi). NEXORA avtomatik 1-9 so‘m qo‘shib unique qiladi. Masalan: 50000 → 50001. Mijoz farqni sezmaydi.

`.env` orqali ham sozlash mumkin (panel ustuvor):
```
HAMYON_SHOP_ID=shop_123
HAMYON_SHOP_KEY=sk_xxx
HAMYON_API_URL=https://hamyon-api.uz
```

## API cheat sheet

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth` | WebApp auth (initData) |
| GET | `/api/games`, `/api/games/<id>` | Catalog |
| POST | `/api/orders` | Create order |
| GET | `/api/orders/mine` | My orders |
| POST | `/api/orders/<code>/receipt` | Upload receipt |
| POST | `/api/hamyon/create` | Hamyon auto payment yaratish (user) |
| GET | `/api/hamyon/status/<code>` | Hamyon holatini tekshirish |
| POST | `/api/hamyon/cancel/<code>` | Hamyon to‘lovni bekor qilish |
| POST | `/api/hamyon/callback/prepare` | Hamyon prepare webhook (public) |
| POST | `/api/hamyon/callback/complete` | Hamyon complete webhook — paid/cancel (public) |
| POST | `/api/hamyon/webhook` | Hamyon yagona webhook (public) |
| GET | `/api/hamyon/callback/info` | Webhook URL larni ko‘rish (helper) |
| GET/PUT | `/api/profile` | Profile |
| POST | `/api/admin/login` | Admin login |
| GET | `/api/admin/stats` | Dashboard + charts data + hamyon stats |
| GET/PUT | `/api/admin/orders…` | Order management |
| CRUD | `/api/admin/games|packages|payments` | Catalog management |
| GET | `/api/admin/hamyon/payments` | Hamyon to‘lovlari tarixi |
| POST | `/api/admin/hamyon/test` | Hamyon test payment |
| GET/PUT | `/api/admin/settings` | All settings (hamyon keys included) |
| POST | `/api/admin/upload?target=` | Image upload |

---
Made with Soft UI • Dark blue + Light blue • NEXORA
