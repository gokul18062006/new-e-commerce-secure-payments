from pydantic import BaseModel
from typing import Optional


class Product(BaseModel):
    name: str
    price: float
    category: str
    description: str
    emoji: str = ""
    color: str = "#6366f1"


class ProductResponse(BaseModel):
    id: str
    name: str
    price: float
    category: str
    description: str
    emoji: str
    color: str
