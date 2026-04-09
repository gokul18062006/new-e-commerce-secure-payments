"""Cart routes — CRUD operations on user's shopping cart."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from utils.auth import get_current_user
from database.db import get_db

router = APIRouter()


class CartItemAdd(BaseModel):
    product_id: str
    quantity: int = 1


class CartItemUpdate(BaseModel):
    product_id: str
    quantity: int


@router.get("/")
async def get_cart(current_user: dict = Depends(get_current_user)):
    db = get_db()
    cart = await db.carts.find_one({"user_id": current_user["_id"]})
    if not cart:
        return {"items": [], "total": 0}
    items = cart.get("items", [])
    total = sum(i["price"] * i["quantity"] for i in items)
    return {"items": items, "total": total}


@router.post("/add")
async def add_to_cart(item: CartItemAdd, current_user: dict = Depends(get_current_user)):
    db = get_db()
    product = await db.products.find_one({"_id": item.product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    cart_item = {
        "product_id": product["_id"],
        "name": product["name"],
        "price": product["price"],
        "emoji": product.get("emoji", ""),
        "color": product.get("color", "#6366f1"),
        "quantity": item.quantity,
    }

    cart = await db.carts.find_one({"user_id": current_user["_id"]})
    if not cart:
        await db.carts.insert_one({"user_id": current_user["_id"], "items": [cart_item]})
    else:
        items = cart.get("items", [])
        found = False
        for existing in items:
            if existing["product_id"] == item.product_id:
                existing["quantity"] += item.quantity
                found = True
                break
        if not found:
            items.append(cart_item)
        await db.carts.update_one({"user_id": current_user["_id"]}, {"$set": {"items": items}})

    return {"message": "Item added to cart"}


@router.put("/update")
async def update_cart_item(item: CartItemUpdate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    cart = await db.carts.find_one({"user_id": current_user["_id"]})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    items = cart.get("items", [])
    for existing in items:
        if existing["product_id"] == item.product_id:
            if item.quantity <= 0:
                items.remove(existing)
            else:
                existing["quantity"] = item.quantity
            await db.carts.update_one({"user_id": current_user["_id"]}, {"$set": {"items": items}})
            return {"message": "Cart updated"}

    raise HTTPException(status_code=404, detail="Item not in cart")


@router.delete("/remove/{product_id}")
async def remove_from_cart(product_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    cart = await db.carts.find_one({"user_id": current_user["_id"]})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    items = [i for i in cart.get("items", []) if i["product_id"] != product_id]
    await db.carts.update_one({"user_id": current_user["_id"]}, {"$set": {"items": items}})
    return {"message": "Item removed"}


@router.delete("/clear")
async def clear_cart(current_user: dict = Depends(get_current_user)):
    db = get_db()
    await db.carts.delete_one({"user_id": current_user["_id"]})
    return {"message": "Cart cleared"}
