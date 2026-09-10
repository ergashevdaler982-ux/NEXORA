"""NEXORA Telegram bot.

The bot is intentionally tiny: on /start it only shows a WebApp button.
Everything else (shop, orders, profile, support) lives inside the WebApp.
It is also used to push order-status notifications to users/admin.
"""
from __future__ import annotations

import html
import json
import logging
import urllib.request

from config import Config

log = logging.getLogger("nexora.bot")

START_TEXT = """<b>NEXORA</b> — o'yin donatlari platformasi
<b>NEXORA</b> — игровая донат-платформа
<b>NEXORA</b> — gaming top-up platform

Roblox • PUBG Mobile • EA Sports FC

Boshlash uchun tugmani bosing / Нажмите кнопку / Tap the button:"""


def has_token() -> bool:
    return bool(Config.BOT_TOKEN)


def _api(method: str, payload: dict):
    if not has_token():
        return None
    try:
        req = urllib.request.Request(
            f"https://api.telegram.org/bot{Config.BOT_TOKEN}/{method}",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as exc:  # network issues must never crash the shop
        log.warning("Telegram API %s failed: %s", method, exc)
        return None


def send_message_sync(chat_id: int | str, text: str, reply_markup: dict | None = None) -> bool:
    payload: dict = {"chat_id": chat_id, "text": text, "parse_mode": "HTML"}
    if reply_markup:
        payload["reply_markup"] = reply_markup
    res = _api("sendMessage", payload)
    return bool(res and res.get("ok"))


_STATUS_LABEL = {
    "uz": {"pending": "Kutilmoqda", "paid": "To'langan", "processing": "Jarayonda",
           "completed": "Bajarildi", "cancelled": "Bekor qilindi"},
    "ru": {"pending": "Ожидает", "paid": "Оплачен", "processing": "В обработке",
           "completed": "Выполнен", "cancelled": "Отменён"},
    "en": {"pending": "Pending", "paid": "Paid", "processing": "Processing",
           "completed": "Completed", "cancelled": "Cancelled"},
}

_NOTIFY_TPL = {
    "uz": "<b>NEXORA</b>\nBuyurtma <b>{code}</b> holati o'zgardi: <b>{status}</b>",
    "ru": "<b>NEXORA</b>\nСтатус заказа <b>{code}</b> изменён: <b>{status}</b>",
    "en": "<b>NEXORA</b>\nOrder <b>{code}</b> status changed: <b>{status}</b>",
}


def webapp_keyboard() -> dict:
    return {"inline_keyboard": [[{
        "text": "▸ Open NEXORA",
        "web_app": {"url": Config.WEBAPP_URL},
    }]]}


def notify_user_status(telegram_id: int, order_code: str, status: str, lang: str = "uz") -> bool:
    lang = lang if lang in _STATUS_LABEL else "uz"
    text = _NOTIFY_TPL[lang].format(
        code=html.escape(order_code),
        status=html.escape(_STATUS_LABEL[lang].get(status, status)),
    )
    return send_message_sync(telegram_id, text, webapp_keyboard())


def notify_admin(text: str) -> bool:
    if not Config.ADMIN_CHAT_ID:
        return False
    return send_message_sync(Config.ADMIN_CHAT_ID, text)


def notify_admin_new_order(order: dict) -> bool:
    text = (
        "<b>Yangi buyurtma / Новый заказ</b>\n"
        f"ID: <b>{html.escape(order.get('order_code', ''))}</b>\n"
        f"Game: {html.escape(order.get('game_name', ''))}\n"
        f"Package: {html.escape(order.get('package_name', ''))} "
        f"({html.escape(str(order.get('package_amount', '')))})\n"
        f"Summa: <b>{html.escape(str(order.get('price', '')))} "
        f"{html.escape(order.get('currency', ''))}</b>\n"
        f"Player: {html.escape(order.get('game_username', ''))}"
    )
    return notify_admin(text)


def run_bot() -> None:
    """Start long-polling (blocking). Only /start + /help exist."""
    from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update, WebAppInfo
    from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes

    async def _start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        keyboard = [[InlineKeyboardButton(
            text="▸ Open NEXORA", web_app=WebAppInfo(url=Config.WEBAPP_URL))]]
        await update.message.reply_html(START_TEXT, reply_markup=InlineKeyboardMarkup(keyboard))

    application = ApplicationBuilder().token(Config.BOT_TOKEN).build()
    application.add_handler(CommandHandler("start", _start))
    application.add_handler(CommandHandler("help", _start))
    log.info("Bot polling started.")
    application.run_polling(drop_pending_updates=True)
