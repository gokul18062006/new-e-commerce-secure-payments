"""
Secure E-Commerce API — FastAPI Application Entry Point.
Features: JWT Auth, AES Encryption, SHA-256 Hashing, Fraud Detection, Rate Limiting.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from routes.auth import router as auth_router
from routes.products import router as products_router
from routes.cart import router as cart_router
from routes.payment import router as payment_router
from database.db import db, seed_database

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.connect()
    await seed_database()
    print("🚀 Secure E-Commerce API started")
    yield
    db.close()


app = FastAPI(
    title="🛒 Secure E-Commerce API",
    description="E-Commerce platform with UPI Payment Gateway, AES encryption, SHA-256 hashing, and fraud detection.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── Rate Limiter ──
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ──
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(products_router, prefix="/api/products", tags=["Products"])
app.include_router(cart_router, prefix="/api/cart", tags=["Cart"])
app.include_router(payment_router, prefix="/api/payment", tags=["Payment"])


@app.get("/", tags=["Health"])
async def root():
    return {
        "message": "Secure E-Commerce API is running",
        "version": "1.0.0",
        "security": ["JWT", "AES-256", "SHA-256", "OTP", "Fraud Detection", "Rate Limiting"],
    }
