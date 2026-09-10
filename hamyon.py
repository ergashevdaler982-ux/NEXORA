"""Hamyon API integration for NEXORA.

Docs: https://hamyon-api.uz/
Flow:
 - POST /payment/create  shop_id, shop_key, amount, order_id -> payment_id, card, expires_in
 - Callbacks: prepare_url and complete_url receive POST with shop_id, payment_id, order_id, amount, status, sign
   sign = md5(shop_id + payment_id + amount + shop_key)

This module handles API calls and signature validation.
"""
from __future__ import annotations

import hashlib
import logging
import random
import time
from typing import Tuple

import requests

import database as db

log = logging.getLogger("nexora.hamyon")

BASE_URL = "https://hamyon-api.uz"
CREATE_ENDPOINT = f"{BASE_URL}/payment/create"
STATUS_ENDPOINT = f"{BASE_URL}/payment/status"
CANCEL_ENDPOINT = f"{BASE_URL}/payment/cancel"

TIMEOUT = 15


def get_hamyon_settings() -> dict:
    """Load hamyon settings from DB."""
    keys = ("hamyon_enabled", "hamyon_shop_id", "hamyon_shop_key", "hamyon_auto_complete")
    return {k: db.get_setting(k, "") for k in keys}


def is_enabled() -> bool:
    return db.get_setting("hamyon_enabled", "0") == "1"


def calc_sign(shop_id: str, payment_id: str, amount: str | int, shop_key: str) -> str:
    raw = f"{shop_id}{payment_id}{amount}{shop_key}"
    return hashlib.md5(raw.encode("utf-8")).hexdigest()


def verify_sign(shop_id: str, payment_id: str, amount: str | int, shop_key: str, sign: str) -> bool:
    expected = calc_sign(shop_id, payment_id, amount, shop_key)
    return expected.lower() == (sign or "").lower()


def _get_open_amounts() -> set:
    """Return set of amounts currently pending in hamyon_payments that haven't expired."""
    now = db.now_str()
    # Consider pending payments where expires_at > now
    rows = db.fetchall(
        "SELECT amount FROM hamyon_payments WHERE status = 'pending' AND expires_at > %s",
        (now,),
    )
    return set(int(float(r["amount"])) for r in rows if r.get("amount") is not None)


def _resolve_unique_amount(base_amount: int, max_tries: int = 15) -> int:
    """Avoid duplicate amount conflict per Hamyon docs.
    If same amount already has open payment, add 1-9 som offset.
    """
    open_amounts = _get_open_amounts()
    if base_amount not in open_amounts:
        return base_amount
    # Try offsets 1..9, then random 10..99
    for offset in range(1, 10):
        cand = base_amount + offset
        if cand not in open_amounts:
            return cand
    for _ in range(max_tries):
        cand = base_amount + random.randint(10, 99)
        if cand not in open_amounts:
            return cand
    # fallback: add timestamp mod
    return base_amount + (int(time.time()) % 90) + 10


def create_payment(shop_id: str, shop_key: str, amount: int, order_id: str) -> Tuple[bool, dict]:
    """Call Hamyon API to create payment. Returns (ok, data|error)."""
    # Ensure amount is int
    try:
        amount_int = int(float(amount))
    except Exception:
        return False, {"error": "invalid_amount"}

    unique_amount = _resolve_unique_amount(amount_int)

    # Try with unique_amount, if still conflict error, retry with incremented amounts
    last_error = None
    for attempt in range(10):
        try_amount = unique_amount + attempt if attempt > 0 else unique_amount
        payload = {
            "shop_id": shop_id,
            "shop_key": shop_key,
            "amount": try_amount,
            "order_id": order_id,
        }
        log.info("Hamyon create attempt amount=%s order=%s", try_amount, order_id)
        try:
            resp = requests.post(CREATE_ENDPOINT, data=payload, timeout=TIMEOUT)
        except requests.RequestException as exc:
            log.error("Hamyon create network error: %s", exc)
            return False, {"error": "network_error", "details": str(exc)}

        try:
            data = resp.json()
        except Exception:
            # maybe text
            data = {"raw": resp.text, "status_code": resp.status_code}

        if resp.status_code == 200 and data.get("payment_id"):
            # success
            data["requested_amount"] = amount_int
            data["actual_amount"] = try_amount
            return True, data
        else:
            err_msg = str(data.get("error", "")).lower()
            last_error = data
            # Check duplicate amount error
            if "ochiq to'lov" in err_msg or "ochiq tolov" in err_msg or "open payment" in err_msg or "mavjud" in err_msg or "already" in err_msg:
                log.warning("Hamyon duplicate amount %s, retrying", try_amount)
                continue
            # other error
            return False, data

    return False, last_error or {"error": "duplicate_amount"}


def get_payment_status(payment_id: str, shop_id: str = "", shop_key: str = "") -> Tuple[bool, dict]:
    """Optional status check via Hamyon API."""
    params = {"payment_id": payment_id}
    if shop_id:
        params["shop_id"] = shop_id
    if shop_key:
        params["shop_key"] = shop_key
    try:
        resp = requests.get(STATUS_ENDPOINT, params=params, timeout=TIMEOUT)
        data = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {"raw": resp.text}
        if resp.status_code == 200:
            return True, data
        return False, data
    except Exception as exc:
        return False, {"error": str(exc)}


def cancel_payment(payment_id: str, shop_id: str, shop_key: str) -> Tuple[bool, dict]:
    payload = {"payment_id": payment_id, "shop_id": shop_id, "shop_key": shop_key}
    try:
        resp = requests.post(CANCEL_ENDPOINT, data=payload, timeout=TIMEOUT)
        data = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {"raw": resp.text}
        return resp.status_code == 200, data
    except Exception as exc:
        return False, {"error": str(exc)}
