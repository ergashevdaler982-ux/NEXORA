"""NEXORA configuration — loaded from environment / .env file."""
from __future__ import annotations

import os

from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))


class Config:
    # --- Telegram ---
    BOT_TOKEN: str = os.getenv("BOT_TOKEN", "").strip()
    WEBAPP_URL: str = os.getenv("WEBAPP_URL", "http://localhost:5000").rstrip("/")
    ADMIN_CHAT_ID: str = os.getenv("ADMIN_CHAT_ID", "").strip()

    # --- Admin ---
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "admin123")

    # --- Web server ---
    SECRET_KEY: str = os.getenv("SECRET_KEY", "nexora-soft-ui-secret")
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "5000"))

    # --- Hamyon API (optional env override, primary is DB settings) ---
    HAMYON_API_URL: str = os.getenv("HAMYON_API_URL", "https://hamyon-api.uz").rstrip("/")
    HAMYON_SHOP_ID: str = os.getenv("HAMYON_SHOP_ID", "").strip()
    HAMYON_SHOP_KEY: str = os.getenv("HAMYON_SHOP_KEY", "").strip()

    # --- MySQL (primary). Empty host => SQLite fallback --
    MYSQL_HOST: str = os.getenv("MYSQL_HOST", "").strip()
    MYSQL_PORT: int = int(os.getenv("MYSQL_PORT", "3306"))
    MYSQL_USER: str = os.getenv("MYSQL_USER", "").strip()
    MYSQL_PASSWORD: str = os.getenv("MYSQL_PASSWORD", "")
    MYSQL_DB: str = os.getenv("MYSQL_DB", "nexora").strip() or "nexora"

    # --- Storage ---
    BASE_DIR = BASE_DIR
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "uploads")
    RECEIPT_DIR: str = os.path.join(BASE_DIR, "uploads", "receipts")
    GAME_IMG_DIR: str = os.path.join(BASE_DIR, "uploads", "games")
    LOGO_DIR: str = os.path.join(BASE_DIR, "uploads", "logos")
    SQLITE_PATH: str = os.path.join(BASE_DIR, "nexora.db")
    MAX_UPLOAD_MB: int = int(os.getenv("MAX_UPLOAD_MB", "8"))

    ALLOWED_IMG_EXTS = {"jpg", "jpeg", "png", "webp"}

    # Order statuses (single source of truth)
    STATUSES = ("pending", "paid", "processing", "completed", "cancelled")
    # Revenue counts everything except pending/cancelled
    REVENUE_STATUSES = ("paid", "processing", "completed")

    LANGUAGES = ("uz", "ru", "en")
