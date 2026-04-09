"""
Fake Bank Server — simulates UPI validation and payment processing.
"""
import random
import re


def validate_upi(upi_id: str) -> bool:
    """Check that UPI ID matches pattern like name@bank."""
    return bool(re.match(r"^[a-zA-Z0-9._-]+@[a-zA-Z]+$", upi_id))


def process_payment(upi_id: str, amount: float) -> dict:
    """Simulate bank-side payment processing (90% success rate)."""
    if not validate_upi(upi_id):
        return {"success": False, "message": "Invalid UPI ID format"}
    if amount <= 0:
        return {"success": False, "message": "Invalid amount"}
    if amount > 100000:
        return {"success": False, "message": "Amount exceeds transaction limit (₹1,00,000)"}

    success = random.random() < 0.90
    if success:
        return {
            "success": True,
            "message": "Payment processed successfully",
            "bank_ref": f"BNK{random.randint(100000000, 999999999)}",
        }
    return {"success": False, "message": "Bank declined the transaction. Please try again."}
