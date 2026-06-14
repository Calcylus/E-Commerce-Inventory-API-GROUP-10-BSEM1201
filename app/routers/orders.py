from datetime import datetime, timedelta, timezone
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user, get_current_admin
from app.database import get_db


router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)


ALLOWED_ORDER_STATUSES = ["pending", "completed", "cancelled"]

ALLOWED_PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"]

ALLOWED_PAYMENT_METHODS = [
    "cash_on_delivery",
    "mobile_money",
    "bank_transfer",
    "card_payment",
]


def now_utc():
    return datetime.now(timezone.utc)


def make_datetime_aware(value):
    if value is None:
        return None

    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)

    return value


def format_order_response(order: models.Order):
    return {
        "id": order.id,
        "user_id": order.user_id,
        "total_amount": order.total_amount,
        "status": order.status,
        "payment_method": order.payment_method,
        "payment_status": order.payment_status,
        "shipping_address": order.shipping_address,
        "city": order.city,
        "phone": order.phone,
        "created_at": order.created_at,
        "order_items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "subtotal": item.subtotal,
            }
            for item in order.items
        ],
    }


def restore_order_stock(order: models.Order, db: Session):
    for item in order.items:
        product = db.query(models.Product).filter(
            models.Product.id == item.product_id
        ).first()

        if product:
            product.stock_quantity += item.quantity


def cancel_unpaid_expired_orders(db: Session, timeout_minutes: int = 30):
    """
    Auto-cancel unpaid pending orders after timeout_minutes.
    This protects stock from being locked forever.
    """

    cutoff_time = now_utc() - timedelta(minutes=timeout_minutes)

    pending_unpaid_orders = db.query(models.Order).filter(
        models.Order.status == "pending",
        models.Order.payment_status == "pending",
    ).all()

    cancelled_orders = []

    for order in pending_unpaid_orders:
        created_at = make_datetime_aware(order.created_at)

        if created_at and created_at <= cutoff_time:
            order.status = "cancelled"
            restore_order_stock(order, db)
            cancelled_orders.append(order)

    if cancelled_orders:
        db.commit()

        for order in cancelled_orders:
            db.refresh(order)

    return cancelled_orders


def auto_complete_if_paid(order: models.Order):
    """
    If an order is paid in full, mark it completed.
    Admin still oversees the system, but this gives automatic payment behavior.
    """

    if order.payment_status == "paid" and order.status == "pending":
        order.status = "completed"


@router.post(
    "/",
    response_model=schemas.OrderResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_order(
    order_data: schemas.OrderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    cancel_unpaid_expired_orders(db)

    if order_data.payment_method not in ALLOWED_PAYMENT_METHODS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid payment method. Allowed methods are: "
                "cash_on_delivery, mobile_money, bank_transfer, card_payment."
            ),
        )

    total_amount = 0
    order_items_to_create = []

    for item in order_data.items:
        product = db.query(models.Product).filter(
            models.Product.id == item.product_id
        ).first()

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {item.product_id} not found.",
            )

        if product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Not enough stock for {product.name}.",
            )

        subtotal = product.price * item.quantity
        total_amount += subtotal

        order_items_to_create.append(
            {
                "product": product,
                "quantity": item.quantity,
                "unit_price": product.price,
                "subtotal": subtotal,
            }
        )

    new_order = models.Order(
        user_id=current_user.id,
        total_amount=total_amount,
        status="pending",
        payment_method=order_data.payment_method,
        payment_status="pending",
        shipping_address=order_data.shipping_address,
        city=order_data.city,
        phone=order_data.phone,
    )

    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    for item_data in order_items_to_create:
        product = item_data["product"]

        new_order_item = models.OrderItem(
            order_id=new_order.id,
            product_id=product.id,
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            subtotal=item_data["subtotal"],
        )

        product.stock_quantity -= item_data["quantity"]
        db.add(new_order_item)

    db.commit()
    db.refresh(new_order)

    return format_order_response(new_order)


@router.get(
    "/my-orders",
    response_model=list[schemas.OrderResponse],
)
def get_my_orders(
    status: Optional[str] = Query(None, description="Filter by status: pending, completed, cancelled"),
    payment_method: Optional[str] = Query(None),
    payment_status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    cancel_unpaid_expired_orders(db)

    query = db.query(models.Order).filter(
        models.Order.user_id == current_user.id
    )

    if status:
        query = query.filter(models.Order.status == status)

    if payment_method:
        query = query.filter(models.Order.payment_method == payment_method)

    if payment_status:
        query = query.filter(models.Order.payment_status == payment_status)

    orders = query.order_by(models.Order.created_at.desc()).offset(skip).limit(limit).all()

    return [format_order_response(order) for order in orders]


@router.get(
    "/",
    response_model=list[schemas.OrderResponse],
)
def get_all_orders(
    status: Optional[str] = Query(None, description="Filter by status: pending, completed, cancelled"),
    payment_method: Optional[str] = Query(None),
    payment_status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin),
):
    cancel_unpaid_expired_orders(db)

    query = db.query(models.Order)

    if status:
        query = query.filter(models.Order.status == status)

    if payment_method:
        query = query.filter(models.Order.payment_method == payment_method)

    if payment_status:
        query = query.filter(models.Order.payment_status == payment_status)

    orders = query.order_by(models.Order.created_at.desc()).offset(skip).limit(limit).all()

    return [format_order_response(order) for order in orders]


@router.put(
    "/{order_id}/status",
    response_model=schemas.OrderResponse,
)
def update_order_status(
    order_id: int,
    status_data: schemas.OrderStatusUpdate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin),
):
    if status_data.status not in ALLOWED_ORDER_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid order status. Use pending, completed, or cancelled.",
        )

    order = db.query(models.Order).filter(
        models.Order.id == order_id
    ).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found.",
        )

    if order.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cancelled orders cannot be changed.",
        )

    if status_data.status == "cancelled" and order.status != "cancelled":
        restore_order_stock(order, db)

    order.status = status_data.status

    db.commit()
    db.refresh(order)

    return format_order_response(order)


@router.put(
    "/{order_id}/payment",
    response_model=schemas.OrderResponse,
)
def update_order_payment_status(
    order_id: int,
    payment_data: schemas.OrderPaymentStatusUpdate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin),
):
    """
    Admin payment confirmation.
    When payment_status becomes paid, the order is automatically completed.
    """

    if payment_data.payment_status not in ALLOWED_PAYMENT_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payment status. Use pending, paid, failed, or refunded.",
        )

    order = db.query(models.Order).filter(
        models.Order.id == order_id
    ).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found.",
        )

    if order.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update payment for a cancelled order.",
        )

    order.payment_status = payment_data.payment_status

    if payment_data.payment_status == "paid":
        order.status = "completed"

    if payment_data.payment_status in ["failed", "refunded"]:
        order.status = "cancelled"
        restore_order_stock(order, db)

    db.commit()
    db.refresh(order)

    return format_order_response(order)


@router.put(
    "/{order_id}/mark-paid",
    response_model=schemas.OrderResponse,
)
def mark_order_paid(
    order_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin),
):
    """
    Simple admin button endpoint.
    Marks an order as paid and automatically completes it.
    """

    order = db.query(models.Order).filter(
        models.Order.id == order_id
    ).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found.",
        )

    if order.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot mark a cancelled order as paid.",
        )

    order.payment_status = "paid"
    order.status = "completed"

    db.commit()
    db.refresh(order)

    return format_order_response(order)


@router.put(
    "/{order_id}/cancel",
    response_model=schemas.OrderResponse,
)
def cancel_my_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    order = db.query(models.Order).filter(
        models.Order.id == order_id,
        models.Order.user_id == current_user.id
    ).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found or does not belong to you.",
        )

    if order.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending orders can be cancelled.",
        )

    order.status = "cancelled"
    restore_order_stock(order, db)

    db.commit()
    db.refresh(order)

    return format_order_response(order)


@router.post(
    "/auto-cancel-unpaid",
)
def auto_cancel_unpaid_orders(
    timeout_minutes: int = Query(30, ge=1, le=1440),
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin),
):
    """
    Admin maintenance endpoint.
    Cancels unpaid pending orders older than timeout_minutes.
    """

    cancelled_orders = cancel_unpaid_expired_orders(db, timeout_minutes)

    return {
        "cancelled_count": len(cancelled_orders),
        "timeout_minutes": timeout_minutes,
        "cancelled_order_ids": [order.id for order in cancelled_orders],
        "message": f"{len(cancelled_orders)} unpaid pending order(s) cancelled.",
    }


@router.post(
    "/check-risk",
    response_model=schemas.OrderRiskResponse,
)
def check_order_risk(
    order_data: schemas.OrderCreate,
    safe_stock_level: int = Query(default=10, ge=0),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    risk_items = []
    total_estimated_amount = 0

    for item in order_data.items:
        product = db.query(models.Product).filter(
            models.Product.id == item.product_id
        ).first()

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {item.product_id} not found.",
            )

        total_estimated_amount += product.price * item.quantity
        stock_after_order = product.stock_quantity - item.quantity

        if stock_after_order < 0:
            risk_items.append(
                {
                    "product_id": product.id,
                    "product_name": product.name,
                    "requested_quantity": item.quantity,
                    "current_stock": product.stock_quantity,
                    "stock_after_order": stock_after_order,
                    "risk_level": "HIGH",
                    "message": (
                        f"This order cannot be fulfilled. "
                        f"Only {product.stock_quantity} units are available."
                    ),
                }
            )

        elif stock_after_order < safe_stock_level:
            risk_items.append(
                {
                    "product_id": product.id,
                    "product_name": product.name,
                    "requested_quantity": item.quantity,
                    "current_stock": product.stock_quantity,
                    "stock_after_order": stock_after_order,
                    "risk_level": "MEDIUM",
                    "message": (
                        f"This order will reduce stock below the safe level "
                        f"of {safe_stock_level}."
                    ),
                }
            )

    is_risky = len(risk_items) > 0

    return {
        "is_risky": is_risky,
        "total_estimated_amount": total_estimated_amount,
        "risk_items": risk_items,
        "message": (
            "Risk detected. Review the order before confirming."
            if is_risky
            else "No major stock risk detected."
        ),
    }


@router.get("/sales/summary")
def get_sales_summary(
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin),
):
    cancel_unpaid_expired_orders(db)

    orders = db.query(models.Order).all()

    total_orders = len(orders)
    pending_orders = len([order for order in orders if order.status == "pending"])
    completed_orders = len([order for order in orders if order.status == "completed"])
    cancelled_orders = len([order for order in orders if order.status == "cancelled"])

    paid_orders = len([order for order in orders if order.payment_status == "paid"])
    pending_payment_orders = len([order for order in orders if order.payment_status == "pending"])

    total_revenue = sum(
        order.total_amount
        for order in orders
        if order.status == "completed" and order.payment_status == "paid"
    )

    return {
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "completed_orders": completed_orders,
        "cancelled_orders": cancelled_orders,
        "paid_orders": paid_orders,
        "pending_payment_orders": pending_payment_orders,
        "total_revenue": total_revenue,
        "message": "Sales summary generated successfully.",
    }