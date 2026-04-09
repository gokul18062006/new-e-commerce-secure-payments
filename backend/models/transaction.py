from pydantic import BaseModel
from typing import Optional, List


class PaymentInitiate(BaseModel):
    upi_id: str
    amount: float


class OTPVerify(BaseModel):
    transaction_id: str
    otp: str


class TransactionResponse(BaseModel):
    id: str
    user_id: str
    amount: float
    status: str
    risk_level: str
    transaction_hash: Optional[str] = None
    timestamp: str
