from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# =========================
# TOKEN SCHEMAS
# =========================

class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


# =========================
# USER SCHEMAS
# =========================

class UserBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(UserBase):
    id: int
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# =========================
# CATEGORY SCHEMAS
# =========================

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=255)


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=255)


class CategoryResponse(CategoryBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# =========================
# PRODUCT SCHEMAS
# =========================

class ProductBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=255)
    price: float = Field(..., gt=0)
    stock_quantity: int = Field(default=0, ge=0)
    category_id: int


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=255)
    price: Optional[float] = Field(None, gt=0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    category_id: Optional[int] = None


class ProductResponse(ProductBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# =========================
# UNIQUE PRODUCT FEATURE SCHEMAS
# =========================

class InventoryHealthResponse(BaseModel):
    total_products: int
    total_categories: int
    total_orders: int
    low_stock_products: int
    out_of_stock_products: int
    total_inventory_value: float
    message: str


class RestockRecommendationResponse(BaseModel):
    product_id: int
    product_name: str
    current_stock: int
    recommended_restock_quantity: int
    reason: str


# =========================
# ORDER ITEM SCHEMAS
# =========================

class OrderItemBase(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)


class OrderItemCreate(OrderItemBase):
    pass


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    subtotal: float

    model_config = ConfigDict(from_attributes=True)


# =========================
# ORDER SCHEMAS
# =========================

class OrderCreate(BaseModel):
    items: List[OrderItemCreate]


class OrderResponse(BaseModel):
    id: int
    user_id: int
    total_amount: float
    status: str
    created_at: datetime
    order_items: List[OrderItemResponse]

    model_config = ConfigDict(from_attributes=True)


class OrderStatusUpdate(BaseModel):
    status: str = Field(..., min_length=3, max_length=30)


# =========================
# UNIQUE ORDER FEATURE SCHEMAS
# =========================

class OrderRiskItemResponse(BaseModel):
    product_id: int
    product_name: str
    requested_quantity: int
    current_stock: int
    stock_after_order: int
    risk_level: str
    message: str


class OrderRiskResponse(BaseModel):
    is_risky: bool
    total_estimated_amount: float
    risk_items: List[OrderRiskItemResponse]
    message: str


class SalesSummaryResponse(BaseModel):
    total_orders: int
    pending_orders: int
    completed_orders: int
    cancelled_orders: int
    total_revenue: float
    message: str