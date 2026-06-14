import asyncio
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app import models, schemas
from app.auth import get_current_admin
from app.database import get_db


router = APIRouter(
    prefix="/products",
    tags=["Products"]
)


def add_rating(product):
    """Attach average_rating to a product object."""
    if product.reviews:
        product.average_rating = round(sum(r.rating for r in product.reviews) / len(product.reviews), 1)
    else:
        product.average_rating = None
    return product


@router.post(
    "/",
    response_model=schemas.ProductResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """
    Create a new product.

    Only admin users can create products.
    """

    category = db.query(models.Category).filter(
        models.Category.id == product.category_id
    ).first()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    new_product = models.Product(
        name=product.name,
        description=product.description,
        price=product.price,
        stock_quantity=product.stock_quantity,
        category_id=product.category_id,
        image_url=product.image_url
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return new_product


@router.get(
    "/",
    response_model=List[schemas.ProductResponse]
)
async def get_all_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """
    Get all products with pagination.

    This endpoint is public.
    """

    products = db.query(models.Product).offset(skip).limit(limit).all()

    return [add_rating(p) for p in products]


@router.get(
    "/search",
    response_model=List[schemas.ProductResponse]
)
async def search_products(
    keyword: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    stock_status: Optional[str] = Query(
        None,
        description="Use: in_stock, low_stock, or out_of_stock"
    ),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """
    Unique feature: Search and filter products.

    Users can search products by:
    - keyword
    - category
    - price range
    - stock status
    """

    query = db.query(models.Product)

    if keyword:
        query = query.filter(
            models.Product.name.ilike(f"%{keyword}%")
        )

    if category_id is not None:
        query = query.filter(
            models.Product.category_id == category_id
        )

    if min_price is not None:
        query = query.filter(
            models.Product.price >= min_price
        )

    if max_price is not None:
        query = query.filter(
            models.Product.price <= max_price
        )

    if stock_status:
        if stock_status == "in_stock":
            query = query.filter(
                models.Product.stock_quantity > 10
            )
        elif stock_status == "low_stock":
            query = query.filter(
                models.Product.stock_quantity > 0,
                models.Product.stock_quantity <= 10
            )
        elif stock_status == "out_of_stock":
            query = query.filter(
                models.Product.stock_quantity == 0
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="stock_status must be in_stock, low_stock, or out_of_stock"
            )

    products = query.offset(skip).limit(limit).all()

    return [add_rating(p) for p in products]


@router.get(
    "/low-stock",
    response_model=List[schemas.ProductResponse]
)
async def get_low_stock_products(
    limit: int = Query(10, ge=0),
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """
    Async feature: Get products with low stock.

    Only admin users can access this endpoint.
    """

    await asyncio.sleep(0.1)

    low_stock_products = db.query(models.Product).filter(
        models.Product.stock_quantity <= limit
    ).all()

    return low_stock_products


@router.get(
    "/inventory/health",
    response_model=schemas.InventoryHealthResponse
)
async def get_inventory_health(
    low_stock_limit: int = Query(10, ge=0),
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """
    Unique feature: Inventory Health Dashboard.

    Shows a quick business overview of the inventory system.
    """

    await asyncio.sleep(0.1)

    products = db.query(models.Product).all()

    total_products = len(products)
    total_categories = db.query(models.Category).count()
    total_orders = db.query(models.Order).count()

    low_stock_products = 0
    out_of_stock_products = 0
    total_inventory_value = 0.0

    for product in products:
        total_inventory_value += product.price * product.stock_quantity

        if product.stock_quantity == 0:
            out_of_stock_products += 1

        if product.stock_quantity <= low_stock_limit:
            low_stock_products += 1

    if out_of_stock_products > 0:
        message = "Inventory needs urgent attention. Some products are out of stock."
    elif low_stock_products > 0:
        message = "Inventory is stable, but some products are running low."
    else:
        message = "Inventory health looks good."

    return {
        "total_products": total_products,
        "total_categories": total_categories,
        "total_orders": total_orders,
        "low_stock_products": low_stock_products,
        "out_of_stock_products": out_of_stock_products,
        "total_inventory_value": round(total_inventory_value, 2),
        "message": message
    }


@router.get(
    "/restock-recommendations",
    response_model=List[schemas.RestockRecommendationResponse]
)
async def get_restock_recommendations(
    low_stock_limit: int = Query(10, ge=0),
    target_stock: int = Query(50, gt=0),
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """
    Unique feature: Smart Stock Recommendation.

    Recommends how many units should be restocked for low-stock products.
    """

    await asyncio.sleep(0.1)

    low_stock_products = db.query(models.Product).filter(
        models.Product.stock_quantity <= low_stock_limit
    ).all()

    recommendations = []

    for product in low_stock_products:
        recommended_quantity = target_stock - product.stock_quantity

        if recommended_quantity < 0:
            recommended_quantity = 0

        recommendations.append({
            "product_id": product.id,
            "product_name": product.name,
            "current_stock": product.stock_quantity,
            "recommended_restock_quantity": recommended_quantity,
            "reason": (
                f"{product.name} has only {product.stock_quantity} units left. "
                f"Restock {recommended_quantity} units to reach the target stock of {target_stock}."
            )
        })

    return recommendations


@router.get(
    "/{product_id}",
    response_model=schemas.ProductResponse
)
async def get_product_by_id(
    product_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a single product by ID.

    This endpoint is public.
    """

    product = db.query(models.Product).filter(
        models.Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    return add_rating(product)


@router.put(
    "/{product_id}",
    response_model=schemas.ProductResponse
)
async def update_product(
    product_id: int,
    product_update: schemas.ProductUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """
    Update a product by ID.

    Only admin users can update products.
    """

    product = db.query(models.Product).filter(
        models.Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    if product_update.category_id is not None:
        category = db.query(models.Category).filter(
            models.Category.id == product_update.category_id
        ).first()

        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )

        product.category_id = product_update.category_id

    if product_update.name is not None:
        product.name = product_update.name

    if product_update.description is not None:
        product.description = product_update.description

    if product_update.price is not None:
        product.price = product_update.price

    if product_update.stock_quantity is not None:
        product.stock_quantity = product_update.stock_quantity

    if product_update.image_url is not None:
        product.image_url = product_update.image_url

    db.commit()
    db.refresh(product)

    return add_rating(product)


@router.post(
    "/bulk-stock-update",
    status_code=status.HTTP_200_OK
)
async def bulk_stock_update(
    data: schemas.BulkStockUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """
    Bulk update stock quantities for multiple products at once.

    Only admin users can use this endpoint.
    """

    updated = []
    for item in data.items:
        product = db.query(models.Product).filter(
            models.Product.id == item.product_id
        ).first()

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {item.product_id} not found."
            )

        product.stock_quantity = item.stock_quantity
        updated.append(product)

    db.commit()

    return {
        "message": f"Stock updated for {len(updated)} product(s).",
        "updated_count": len(updated)
    }


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_200_OK
)
async def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """
    Delete a product by ID.

    Only admin users can delete products.
    """

    product = db.query(models.Product).filter(
        models.Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    product_in_orders = db.query(models.OrderItem).filter(
        models.OrderItem.product_id == product_id
    ).first()

    if product_in_orders:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete product because it exists in an order"
        )

    db.delete(product)
    db.commit()

    return {
        "message": "Product deleted successfully"
    }