"""Authentication routes — register, login, get current user."""
from fastapi import APIRouter, HTTPException, Depends
from models.user import UserCreate, UserLogin, TokenResponse
from utils.hashing import hash_password, verify_password
from utils.auth import create_access_token, get_current_user
from database.db import get_db
from datetime import datetime, timezone

router = APIRouter()


@router.post("/register", response_model=TokenResponse)
async def register(user: UserCreate):
    db = get_db()
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_doc = {
        "email": user.email,
        "name": user.name or user.email.split("@")[0],
        "password_hash": hash_password(user.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.users.insert_one(user_doc)
    token = create_access_token({"sub": result.inserted_id, "email": user.email})
    return {"access_token": token, "token_type": "bearer"}


@router.post("/login", response_model=TokenResponse)
async def login(user: UserLogin):
    db = get_db()
    db_user = await db.users.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": db_user["_id"], "email": db_user["email"]})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["_id"],
        "email": current_user["email"],
        "name": current_user.get("name", ""),
        "created_at": current_user.get("created_at"),
        "is_admin": current_user.get("is_admin", False),
    }
