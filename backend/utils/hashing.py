"""
Hashing utilities — SHA-256 for transactions, bcrypt for passwords.
Uses bcrypt directly (passlib has compatibility issues with bcrypt>=4.1).
"""
import hashlib
import bcrypt


def generate_transaction_hash(data: str) -> str:
    """SHA-256 hash of transaction data for integrity verification."""
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify password against bcrypt hash."""
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
