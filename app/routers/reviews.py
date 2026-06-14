from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db


router = APIRouter(
    prefix="/products/{product_id}/reviews",
    tags=["Reviews"]
)


@router.post(
    "/",
    response_model=schemas.ReviewResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_review(
    product_id: int,
    review: schemas.ReviewCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Add a review for a product.
    """

    product = db.query(models.Product).filter(
        models.Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    existing = db.query(models.Review).filter(
        models.Review.product_id == product_id,
        models.Review.user_id == current_user.id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already reviewed this product"
        )

    new_review = models.Review(
        product_id=product_id,
        user_id=current_user.id,
        rating=review.rating,
        comment=review.comment
    )

    db.add(new_review)
    db.commit()
    db.refresh(new_review)

    return new_review


@router.get(
    "/",
    response_model=List[schemas.ReviewResponse]
)
async def get_product_reviews(
    product_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """
    Get all reviews for a product.
    """

    product = db.query(models.Product).filter(
        models.Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    reviews = db.query(models.Review).filter(
        models.Review.product_id == product_id
    ).order_by(models.Review.created_at.desc()).offset(skip).limit(limit).all()

    return reviews
