"""
AES-256 Encryption (EAX mode) for sensitive payment data.
Stores ciphertext + nonce + tag as a single base64 payload.
"""
from Crypto.Cipher import AES
import base64
import json


def _get_key_bytes(key: str) -> bytes:
    """Ensure exactly 32 bytes for AES-256."""
    kb = key.encode("utf-8")[:32]
    return kb + b"\0" * (32 - len(kb))


def encrypt_data(plaintext: str, key: str) -> str:
    """Encrypt a string and return base64-encoded payload."""
    cipher = AES.new(_get_key_bytes(key), AES.MODE_EAX)
    ct, tag = cipher.encrypt_and_digest(plaintext.encode("utf-8"))
    payload = {
        "ct": base64.b64encode(ct).decode(),
        "nonce": base64.b64encode(cipher.nonce).decode(),
        "tag": base64.b64encode(tag).decode(),
    }
    return base64.b64encode(json.dumps(payload).encode()).decode()


def decrypt_data(encrypted: str, key: str) -> str:
    """Decrypt a base64-encoded payload back to plaintext."""
    data = json.loads(base64.b64decode(encrypted))
    cipher = AES.new(
        _get_key_bytes(key),
        AES.MODE_EAX,
        nonce=base64.b64decode(data["nonce"]),
    )
    pt = cipher.decrypt_and_verify(
        base64.b64decode(data["ct"]),
        base64.b64decode(data["tag"]),
    )
    return pt.decode("utf-8")
