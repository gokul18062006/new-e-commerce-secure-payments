"""
OTP Generator — 6-digit, 5-minute TTL, single-use.
Uses in-memory store (swap to Redis in production).
"""
import random
import time

_otp_store: dict[str, dict] = {}

OTP_TTL_SECONDS = 300  # 5 minutes


def generate_otp() -> str:
    return str(random.randint(100000, 999999))


def store_otp(transaction_id: str, otp: str) -> None:
    _otp_store[transaction_id] = {
        "otp": otp,
        "created_at": time.time(),
        "used": False,
    }


def verify_otp(transaction_id: str, otp: str) -> bool:
    record = _otp_store.get(transaction_id)
    if not record:
        return False
    if record["used"]:
        return False
    if time.time() - record["created_at"] > OTP_TTL_SECONDS:
        return False
    if record["otp"] != otp:
        return False
    record["used"] = True
    return True
