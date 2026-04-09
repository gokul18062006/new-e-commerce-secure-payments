"""
Fraud Detection — flags suspicious payment patterns.
"""
import time

_payment_log: dict[str, list[float]] = {}


def check_fraud(user_id: str, amount: float, upi_id: str = "") -> dict:
    now = time.time()
    risk_level = "low"
    flags: list[str] = []

    # ── Rule 1: >3 payments in 10 seconds → HIGH ──
    if user_id in _payment_log:
        recent = [t for t in _payment_log[user_id] if now - t < 10]
        if len(recent) >= 3:
            risk_level = "high"
            flags.append("Rapid successive payments detected (>3 in 10s)")

    # ── Rule 2: amount > ₹50,000 → MEDIUM ──
    if amount > 50000:
        if risk_level != "high":
            risk_level = "medium"
        flags.append("High-value transaction (>₹50,000)")

    # ── Rule 3: amount > ₹1,00,000 → HIGH ──
    if amount > 100000:
        risk_level = "high"
        flags.append("Very high-value transaction (>₹1,00,000)")

    # ── Log this attempt ──
    if user_id not in _payment_log:
        _payment_log[user_id] = []
    _payment_log[user_id].append(now)
    # keep only last 60s
    _payment_log[user_id] = [t for t in _payment_log[user_id] if now - t < 60]

    return {
        "risk_level": risk_level,
        "flags": flags,
        "blocked": risk_level == "high",
    }
