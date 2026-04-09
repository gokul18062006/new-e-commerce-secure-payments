"""Product routes — list and detail."""
from fastapi import APIRouter, HTTPException
from database.db import get_db

router = APIRouter()


@router.get("/")
async def list_products(category: str = None):
    db = get_db()
    if category and category != "all":
        products = await db.products.find({"category": category})
    else:
        products = await db.products.find()
    return {"products": products, "count": len(products)}


@router.get("/{product_id}")
async def get_product(product_id: str):
    db = get_db()
    product = await db.products.find_one({"_id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
