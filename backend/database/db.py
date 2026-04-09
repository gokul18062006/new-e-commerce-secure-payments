"""
Database module — Motor async driver for MongoDB Atlas.
Falls back to in-memory storage if Atlas is unreachable.
"""
import os
import uuid
from typing import Any, Optional
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "")
DATABASE_NAME = os.getenv("DATABASE_NAME", "secure_ecommerce")


# ══════════════════════════════════════════════════════════
#  In-Memory Fallback Collection
# ══════════════════════════════════════════════════════════
class InMemoryCollection:
    def __init__(self, name: str):
        self.name = name
        self._docs: dict[str, dict] = {}

    async def insert_one(self, doc: dict) -> Any:
        doc_id = doc.get("_id", str(uuid.uuid4()))
        doc["_id"] = doc_id
        self._docs[doc_id] = doc.copy()

        class Result:
            inserted_id = doc_id
        return Result()

    async def find_one(self, query: dict = None) -> Optional[dict]:
        for doc in self._docs.values():
            if self._matches(doc, query or {}):
                return doc.copy()
        return None

    async def find(self, query: dict = None) -> list[dict]:
        return [d.copy() for d in self._docs.values() if self._matches(d, query or {})]

    async def update_one(self, query: dict, update: dict) -> Any:
        for doc in self._docs.values():
            if self._matches(doc, query):
                if "$set" in update:
                    doc.update(update["$set"])
                if "$push" in update:
                    for k, v in update["$push"].items():
                        doc.setdefault(k, []).append(v)

                class Result:
                    modified_count = 1
                return Result()

        class NoResult:
            modified_count = 0
        return NoResult()

    async def delete_one(self, query: dict) -> Any:
        for did, doc in list(self._docs.items()):
            if self._matches(doc, query):
                del self._docs[did]

                class Result:
                    deleted_count = 1
                return Result()

        class NoResult:
            deleted_count = 0
        return NoResult()

    async def count_documents(self, query: dict) -> int:
        return sum(1 for d in self._docs.values() if self._matches(d, query))

    def _matches(self, doc: dict, query: dict) -> bool:
        return all(doc.get(k) == v for k, v in query.items())


# ══════════════════════════════════════════════════════════
#  Motor (MongoDB Atlas) Collection Wrapper
# ══════════════════════════════════════════════════════════
class MotorCollectionWrapper:
    def __init__(self, col):
        self._col = col

    async def insert_one(self, doc: dict) -> Any:
        if "_id" not in doc:
            doc["_id"] = str(uuid.uuid4())
        return await self._col.insert_one(doc)

    async def find_one(self, query: dict = None) -> Optional[dict]:
        return await self._col.find_one(query or {})

    async def find(self, query: dict = None) -> list[dict]:
        cursor = self._col.find(query or {})
        return await cursor.to_list(length=1000)

    async def update_one(self, query: dict, update: dict) -> Any:
        return await self._col.update_one(query, update)

    async def delete_one(self, query: dict) -> Any:
        return await self._col.delete_one(query)

    async def count_documents(self, query: dict) -> int:
        return await self._col.count_documents(query)


# ══════════════════════════════════════════════════════════
#  Database Singleton (auto-fallback)
# ══════════════════════════════════════════════════════════
class Database:
    def __init__(self):
        self.client = None
        self.db = None
        self._cache: dict = {}
        self._using_mongo = False
        self._memory_collections: dict[str, InMemoryCollection] = {}

    def connect(self):
        """Try connecting to MongoDB Atlas. Falls back to in-memory."""
        if not MONGODB_URI:
            print("⚠️  No MONGODB_URI — using in-memory database")
            return

        try:
            from motor.motor_asyncio import AsyncIOMotorClient
            self.client = AsyncIOMotorClient(
                MONGODB_URI, 
                serverSelectionTimeoutMS=10000,
                connectTimeoutMS=10000
            )
            self.db = self.client[DATABASE_NAME]
            self._using_mongo = True
            print(f"✅ Connected to MongoDB Atlas — database: {DATABASE_NAME}")
        except Exception as e:
            print(f"⚠️  MongoDB connection failed ({e}) — using in-memory database")
            self._using_mongo = False

    def close(self):
        if self.client:
            self.client.close()
            print("👋 MongoDB connection closed")

    def _get_col(self, name: str):
        if self._using_mongo and self.db is not None:
            if name not in self._cache:
                self._cache[name] = MotorCollectionWrapper(self.db[name])
            return self._cache[name]
        # Fallback: in-memory
        if name not in self._memory_collections:
            self._memory_collections[name] = InMemoryCollection(name)
        return self._memory_collections[name]

    def fallback_to_memory(self):
        """Switch to in-memory after a failed Atlas operation."""
        print("⚠️  Falling back to in-memory database")
        self._using_mongo = False
        self._cache.clear()

    @property
    def users(self):
        return self._get_col("users")

    @property
    def products(self):
        return self._get_col("products")

    @property
    def carts(self):
        return self._get_col("carts")

    @property
    def transactions(self):
        return self._get_col("transactions")


db = Database()


def get_db() -> Database:
    return db


# ── Seed Data ───────────────────────────────────────────
SEED_PRODUCTS = [
    {"name": "Wireless Noise-Cancelling Headphones", "price": 2499, "category": "electronics",
     "description": "Premium ANC headphones with 30-hour battery life, deep bass, and ultra-comfortable ear cushions.",
     "emoji": "🎧", "color": "#6366f1"},
    {"name": "Smart Fitness Watch Pro", "price": 4999, "category": "electronics",
     "description": "AMOLED display, heart-rate & SpO2 tracking, 7-day battery, water-resistant to 50m.",
     "emoji": "⌚", "color": "#8b5cf6"},
    {"name": "Bluetooth Speaker X200", "price": 1799, "category": "electronics",
     "description": "360° surround sound, IPX7 waterproof, 20-hour playtime, built-in microphone.",
     "emoji": "🔊", "color": "#3b82f6"},
    {"name": "USB-C 7-in-1 Hub", "price": 899, "category": "electronics",
     "description": "HDMI 4K, USB 3.0 x3, SD/TF card reader, PD 100W charging. Aluminium build.",
     "emoji": "🔌", "color": "#0ea5e9"},
    {"name": "Premium Running Sneakers", "price": 3499, "category": "fashion",
     "description": "Lightweight mesh upper, responsive foam sole, reflective accents for night runs.",
     "emoji": "👟", "color": "#10b981"},
    {"name": "Genuine Leather Wallet", "price": 1299, "category": "fashion",
     "description": "RFID-blocking, 8 card slots, coin pocket, premium Italian leather craftsmanship.",
     "emoji": "👛", "color": "#f59e0b"},
    {"name": "Polarised Aviator Sunglasses", "price": 999, "category": "fashion",
     "description": "UV400 protection, titanium frame, scratch-resistant lenses, classic aviator style.",
     "emoji": "🕶️", "color": "#ec4899"},
    {"name": "Urban Travel Backpack", "price": 2199, "category": "fashion",
     "description": "35L capacity, laptop compartment, anti-theft pocket, water-repellent fabric.",
     "emoji": "🎒", "color": "#14b8a6"},
    {"name": "LED Smart Desk Lamp", "price": 1599, "category": "home",
     "description": "Touch dimming, 5 colour temperatures, wireless charging base, eye-care LED.",
     "emoji": "💡", "color": "#eab308"},
    {"name": "Automatic Drip Coffee Maker", "price": 3999, "category": "home",
     "description": "12-cup capacity, programmable timer, anti-drip system, stainless-steel carafe.",
     "emoji": "☕", "color": "#a855f7"},
    {"name": "Ceramic Plant Pot Set (3pc)", "price": 699, "category": "home",
     "description": "Nordic minimalist design, drainage holes, bamboo trays, matte finish.",
     "emoji": "🪴", "color": "#22c55e"},
    {"name": "Luxury Scented Candles (4pc)", "price": 499, "category": "home",
     "description": "Soy wax, 40-hour burn time each, lavender / vanilla / sandalwood / jasmine.",
     "emoji": "🕯️", "color": "#f97316"},
]


async def seed_database():
    """Populate products collection and default secure admin if empty."""
    try:
        # Seed Products
        count = await db.products.count_documents({})
        if count == 0:
            for product in SEED_PRODUCTS:
                await db.products.insert_one(product.copy())
            mode = "MongoDB Atlas" if db._using_mongo else "in-memory"
            print(f"✅ Seeded {len(SEED_PRODUCTS)} products ({mode})")
        else:
            print(f"📦 Products already seeded ({count} found)")
            
        # Seed Secure Admin
        from utils.hashing import hash_password
        admin_count = await db.users.count_documents({"email": "admin@securepay.com"})
        if admin_count == 0:
            admin_doc = {
                "email": "admin@securepay.com",
                "name": "Super Admin",
                "password_hash": hash_password("AdminSecure@2026"),
                "is_admin": True,
                "created_at": "2026-04-09T00:00:00Z"
            }
            await db.users.insert_one(admin_doc)
            print("✅ Default secure admin created. Email: admin@securepay.com | Pass: AdminSecure@2026")
            
    except Exception as e:
        print(f"⚠️  MongoDB seed failed: {e}")
        db.fallback_to_memory()
        # Re-seed into memory
        for product in SEED_PRODUCTS:
            await db.products.insert_one(product.copy())
        
        # Admin into memory
        from utils.hashing import hash_password
        admin_doc = {
            "email": "admin@securepay.com",
            "name": "Super Admin",
            "password_hash": hash_password("AdminSecure@2026"),
            "is_admin": True,
            "created_at": "2026-04-09T00:00:00Z"
        }
        await db.users.insert_one(admin_doc)
            
        print(f"✅ Seeded products & admin (in-memory fallback)")
