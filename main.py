#!/usr/bin/env python3
"""NEXORA — run everything with a single command:  python main.py

Starts the WebApp + Admin web server and (if BOT_TOKEN is set)
the Telegram bot in polling mode.
"""
from __future__ import annotations

import logging
import os
import threading
import time

from config import Config
import database as db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("nexora")

BANNER = r"""
  _   _ ________   _____  ____  ____      _
 | \ | | ____\ \/ / _ \|  _ \|  _ \    / \
 |  \| |  _|  \  / | | | |_) | |_) |  / _ \
 | |\  | |___ /  \ |_| |  _ <|  _ <  / ___ \
 |_| \_|_____/_/\_\___/|_| \_\_| \_\/_/   \_\
  Soft UI Gaming Donation Platform — Roblox • PUBG • EA Sports
"""


def ensure_dirs() -> None:
    for folder in (Config.UPLOAD_DIR, Config.RECEIPT_DIR, Config.GAME_IMG_DIR, Config.LOGO_DIR):
        os.makedirs(folder, exist_ok=True)
    keep = os.path.join(Config.UPLOAD_DIR, ".gitkeep")
    if not os.path.exists(keep):
        open(keep, "a").close()


def run_web() -> None:
    from app import create_app

    create_app().run(host=Config.HOST, port=Config.PORT,
                     use_reloader=False, threaded=True)


def main() -> None:
    print(BANNER)
    ensure_dirs()
    dialect = db.init_db()
    db.seed_db()

    print(f"  • Database : {dialect.upper()}")
    print(f"  • WebApp   : {Config.WEBAPP_URL}")
    print(f"  • Local    : http://{Config.HOST}:{Config.PORT}")
    print(f"  • Admin    : http://{Config.HOST}:{Config.PORT}/admin")
    print(f"  • Bot      : {'ON (polling)' if Config.BOT_TOKEN else 'OFF (BOT_TOKEN missing)'}")
    print()

    if Config.BOT_TOKEN:
        import bot as tg

        web_thread = threading.Thread(target=run_web, name="nexora-web", daemon=True)
        web_thread.start()
        time.sleep(1.0)
        try:
            tg.run_bot()  # blocking
        except KeyboardInterrupt:
            pass
    else:
        log.warning("BOT_TOKEN is empty — running web server only.")
        try:
            run_web()  # blocking
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
