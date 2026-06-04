from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_admin, get_current_user
from app.database import get_db


router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)


@router.post(
    "/",
    response_model=schemas.OrderResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_order(
    order_data: schemas.OrderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Create a new order for the logged-in user.

    This endpoint:
    - Checks that each product exists
    - Checks available stock
    - Calculates subtotal and total amount
    - Reduces product stock
    - Creates order and order items
    """

    if not order_data.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must contain at least one item"
        )

    total_amount: float = 0.0
    order_items_to_create = []

    for item in order_data.items:
        product = db.query(models.Product).filter(
            models.Product.id == item.product_id
        ).first()

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {item.product_id} not found"
            )

        if product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Not enough stock for product: {product.name}"
            )

        unit_price = product.price
        subtotal = unit_price * item.quantity
        total_amount += subtotal

        order_items_to_create.append({
            "product": product,
            "quantity": item.quantity,
            "unit_price": unit_price,
            "subtotal": subtotal
        })

    new_order = models.Order(
        user_id=current_user.id,
        total_amount=total_amount,
        status="pending"
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
            subtotal=item_data["subtotal"]
        )

        product.stock_quantity -= item_data["quantity"]

        db.add(new_order_item)

    db.commit()
    db.refresh(new_order)

    return new_order


@router.post(
    "/check-risk",
    response_model=schemas.OrderRiskResponse
)
async def check_order_risk(
    order_data: schemas.OrderCreate,
    safe_stock_level: int = Query(10, ge=0),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Unique feature: Order Risk Detection.

    This checks an order before it is placed and warns if the order
    will reduce any product below the safe stock level.
    """

    if not order_data.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must contain at least one item"
        )

    total_estimated_amount: float = 0.0
    risk_items = []
    is_risky = False

    for item in order_data.items:
        product = db.query(models.Product).filter(
            models.Product.id == item.product_id
        ).first()

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {item.product_id} not found"
            )

        if item.quantity > product.stock_quantity:
            risk_level = "HIGH"
            message = (
                f"Requested quantity is higher than available stock. "
                f"Only {product.stock_quantity} units are available."
            )
            is_risky = True
            stock_after_order = product.stock_quantity - item.quantity

        else:
            stock_after_order = product.stock_quantity - item.quantity
            total_estimated_amount += product.price * item.quantity

            if stock_after_order == 0:
                risk_level = "HIGH"
                message = "This order will make the product out of stock."
                is_risky = True

            elif stock_after_order <= safe_stock_level:
                risk_level = "MEDIUM"
                message = (
                    f"This order will reduce stock below the safe level "
                    f"of {safe_stock_level}."
                )
                is_risky = True

            else:
                risk_level = "LOW"
                message = "This order is safe. Stock will remain healthy."

        risk_items.append({
            "product_id": product.id,
            "product_name": product.name,
            "requested_quantity": item.quantity,
            "current_stock": product.stock_quantity,
            "stock_after_order": stock_after_order,
            "risk_level": risk_level,
            "message": message
        })

    if is_risky:
        final_message = "Risk detected. Review the order before confirming."
    else:
        final_message = "No major risk detected. Order looks safe."

    return {
        "is_risky": is_risky,
        "total_estimated_amount": round(total_estimated_amount, 2),
        "risk_items": risk_items,
        "message": final_message
    }


@router.get(
    "/sales/summary",
    response_model=schemas.SalesSummaryResponse
)
async def get_sales_summary(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """
    Unique feature: Sales Summary Dashboard.

    Gives admins a quick view of order performance and revenue.
    """

    orders = db.query(models.Order).all()

    total_orders = len(orders)
    pending_orders = 0
    completed_orders = 0
    cancelled_orders = 0
    total_revenue = 0.0

    for order in orders:
        if order.status == "pending":
            pending_orders += 1

        elif order.status == "completed":
            completed_orders += 1
            total_revenue += order.total_amount

        elif order.status == "cancelled":
            cancelled_orders += 1

    if total_orders == 0:
        message = "No sales data available yet."
    elif completed_orders == 0:
        message = "Orders exist, but no completed sales yet."
    else:
        message = "Sales summary generated successfully."

    return {
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "completed_orders": completed_orders,
        "cancelled_orders": cancelled_orders,
        "total_revenue": round(total_revenue, 2),
        "message": message
    }


@router.get(
    "/my-orders",
    response_model=List[schemas.OrderResponse]
)
async def get_my_orders(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get all orders made by the currently logged-in user.
    """

    orders = db.query(models.Order).filter(
        models.Order.user_id == current_user.id
    ).all()

    return orders


@router.get(
    "/",
    response_model=List[schemas.OrderResponse]
)
async def get_all_orders(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """
    Get all orders.

    Only admin users can access this endpoint.
    """

    orders = db.query(models.Order).all()

    return orders


@router.get(
    "/{order_id}",
    response_model=schemas.OrderResponse
)
async def get_order_by_id(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get one order by ID.

    Admin can view any order.
    Customers can only view their own orders.
    """

    order = db.query(models.Order).filter(
        models.Order.id == order_id
    ).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    if current_user.role != "admin" and order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to view this order"
        )

    return order


@router.put(
    "/{order_id}/status",
    response_model=schemas.OrderResponse
)
async def update_order_status(
    order_id: int,
    status_update: schemas.OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """
    Update order status.

    Only admin users can update order status.
    """

    allowed_statuses = ["pending", "completed", "cancelled"]

    if status_update.status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be pending, completed, or cancelled"
        )

    order = db.query(models.Order).filter(
        models.Order.id == order_id
    ).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    order.status = status_update.status

    db.commit()
    db.refresh(order)

    return order