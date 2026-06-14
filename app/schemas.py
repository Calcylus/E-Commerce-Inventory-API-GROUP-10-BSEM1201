from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


# =========================
# USER SCHEMAS
# =========================

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    username: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)


class Token(BaseModel):
    access_token: str
    token_type: str


# =========================
# CATEGORY SCHEMAS
# =========================

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None


class CategoryResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# =========================
# PRODUCT SCHEMAS
# =========================

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float = Field(gt=0)
    stock_quantity: int = Field(ge=0)
    category_id: int
    image_url: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = Field(default=None, gt=0)
    stock_quantity: Optional[int] = Field(default=None, ge=0)
    category_id: Optional[int] = None
    image_url: Optional[str] = None


class ProductResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    price: float
    stock_quantity: int
    category_id: int
    image_url: Optional[str] = None
    average_rating: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


class BulkStockItem(BaseModel):
    product_id: int
    stock_quantity: int = Field(ge=0)


class BulkStockUpdate(BaseModel):
    items: List[BulkStockItem]


# =========================
# REVIEW SCHEMAS
# =========================

class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None


class ReviewResponse(BaseModel):
    id: int
    product_id: int
    user_id: int
    rating: int
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# =========================
# PAGINATION
# =========================

class PaginatedResponse(BaseModel):
    items: List
    total: int
    skip: int
    limit: int


class ContactCreate(BaseModel):
    name: str
    email: str
    subject: str
    message: str


class ContactResponse(BaseModel):
    id: int
    name: str
    email: str
    subject: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class LowStockProductResponse(BaseModel):
    id: int
    name: str
    stock_quantity: int
    message: str


class RestockRecommendationResponse(BaseModel):
    product_id: int
    product_name: str
    current_stock: int
    recommended_restock_quantity: int
    reason: str


class InventoryHealthResponse(BaseModel):
    total_products: int
    total_categories: int
    total_orders: int
    low_stock_products: int
    out_of_stock_products: int
    total_inventory_value: float
    message: str


# =========================
# ORDER SCHEMAS
# =========================

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)


class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    payment_method: str = "cash_on_delivery"
    shipping_address: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    subtotal: float

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: int
    user_id: int
    total_amount: float
    status: str
    payment_method: str
    payment_status: str
    shipping_address: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    created_at: datetime
    order_items: List[OrderItemResponse]

    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    status: str

class OrderPaymentStatusUpdate(BaseModel):
    payment_status: str
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


# =========================
# DASHBOARD / ANALYTICS SCHEMAS
# =========================

class SalesSummaryResponse(BaseModel):
    total_orders: int
    pending_orders: int
    completed_orders: int
    cancelled_orders: int
    paid_orders: Optional[int] = 0
    pending_payment_orders: Optional[int] = 0
    total_revenue: float
    message: str


class DashboardMetricsResponse(BaseModel):
    total_products: int
    total_categories: int
    total_orders: int
    low_stock_products: int
    out_of_stock_products: int
    total_inventory_value: float
    message: str