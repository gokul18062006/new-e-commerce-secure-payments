"""
Payment routes — initiate payment, verify OTP, transaction history.
This is the CORE security feature of the project.
"""
import os
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from models.transaction import PaymentInitiate, OTPVerify
from utils.auth import get_current_user
from utils.encryption import encrypt_data, decrypt_data
from utils.hashing import generate_transaction_hash
from utils.otp import generate_otp, store_otp, verify_otp
from utils.fraud_detection import check_fraud
from utils.fake_bank import validate_upi, process_payment
from database.db import get_db
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()
AES_KEY = os.getenv("AES_KEY", "0123456789abcdef0123456789abcdef")


@router.post("/initiate")
async def initiate_payment(payment: PaymentInitiate, current_user: dict = Depends(get_current_user)):
    """Step 1: Validate → Encrypt → Fraud-check → Generate OTP."""

    # ── Input validation ──
    if not validate_upi(payment.upi_id):
        raise HTTPException(status_code=400, detail="Invalid UPI ID. Use format: name@bank")
    if payment.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    if payment.amount > 100000:
        raise HTTPException(status_code=400, detail="Amount exceeds ₹1,00,000 limit")

    # ── Fraud detection ──
    fraud = check_fraud(current_user["_id"], payment.amount, payment.upi_id)
    if fraud["blocked"]:
        raise HTTPException(status_code=403, detail=f"Transaction blocked — {', '.join(fraud['flags'])}")

    # ── AES encrypt sensitive data ──
    encrypted_upi = encrypt_data(payment.upi_id, AES_KEY)
    encrypted_amount = encrypt_data(str(payment.amount), AES_KEY)

    # ── Create pending transaction ──
    db = get_db()
    txn = {
        "user_id": current_user["_id"],
        "user_email": current_user["email"],
        "upi_id_encrypted": encrypted_upi,
        "amount_encrypted": encrypted_amount,
        "amount": payment.amount,
        "status": "pending_otp",
        "risk_level": fraud["risk_level"],
        "flags": fraud["flags"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.transactions.insert_one(txn)

    # ── Generate & store OTP ──
    otp = generate_otp()
    store_otp(result.inserted_id, otp)

    return {
        "transaction_id": result.inserted_id,
        "message": "OTP generated. Enter it to complete payment.",
        "otp_hint": otp,  # ⚠️ DEMO ONLY — remove in production
        "risk_level": fraud["risk_level"],
        "encrypted_upi_preview": encrypted_upi[:30] + "...",
    }


@router.post("/verify-otp")
async def verify_payment_otp(data: OTPVerify, current_user: dict = Depends(get_current_user)):
    """Step 2: Verify OTP → Bank processing → SHA-256 hash → Store result."""

    # ── OTP verification ──
    if not verify_otp(data.transaction_id, data.otp):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    db = get_db()
    txn = await db.transactions.find_one({"_id": data.transaction_id})
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if txn["user_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Unauthorized")

    # ── Decrypt UPI for bank processing ──
    upi_id = decrypt_data(txn["upi_id_encrypted"], AES_KEY)

    # ── Fake bank processing ──
    bank_result = process_payment(upi_id, txn["amount"])

    # ── Generate transaction integrity hash (SHA-256) ──
    hash_input = json.dumps({
        "txn_id": data.transaction_id,
        "user_id": current_user["_id"],
        "upi_id": upi_id,
        "amount": txn["amount"],
        "timestamp": txn["timestamp"],
        "bank_success": bank_result["success"],
    }, sort_keys=True)
    txn_hash = generate_transaction_hash(hash_input)

    # ── Update transaction status ──
    new_status = "success" if bank_result["success"] else "failed"
    update_data = {
        "status": new_status,
        "transaction_hash": txn_hash,
        "bank_ref": bank_result.get("bank_ref", ""),
        "bank_message": bank_result["message"],
        "completed_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.transactions.update_one({"_id": data.transaction_id}, {"$set": update_data})

    return {
        "success": bank_result["success"],
        "status": new_status,
        "message": bank_result["message"],
        "transaction_hash": txn_hash,
        "bank_ref": bank_result.get("bank_ref", ""),
        "amount": txn["amount"],
    }


@router.get("/history")
async def payment_history(current_user: dict = Depends(get_current_user)):
    """Get all transactions for the current user."""
    db = get_db()
    txns = await db.transactions.find({"user_id": current_user["_id"]})
    # Remove encrypted fields from response
    safe_txns = []
    for t in txns:
        safe_txns.append({
            "id": t["_id"],
            "amount": t["amount"],
            "status": t["status"],
            "risk_level": t.get("risk_level", "low"),
            "transaction_hash": t.get("transaction_hash", ""),
            "bank_ref": t.get("bank_ref", ""),
            "timestamp": t["timestamp"],
            "completed_at": t.get("completed_at", ""),
        })
    # Sort newest first
    safe_txns.sort(key=lambda x: x["timestamp"], reverse=True)
    return {"transactions": safe_txns, "count": len(safe_txns)}
