from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_admin
from app.database import get_db


router = APIRouter(
    prefix="/categories",
    tags=["Categories"]
)


@router.post(
    "/",
    response_model=schemas.CategoryResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_category(
    category: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """
    Create a new product category.

    Only admin users can create categories.
    """

    existing_category = db.query(models.Category).filter(
        models.Category.name == category.name
    ).first()

    if existing_category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category already exists"
        )

    new_category = models.Category(
        name=category.name,
        description=category.description
    )

    db.add(new_category)
    db.commit()
    db.refresh(new_category)

    return new_category


@router.get(
    "/",
    response_model=List[schemas.CategoryResponse]
)
async def get_all_categories(
    db: Session = Depends(get_db)
):
    """
    Get all product categories.

    This endpoint is public.
    """

    categories = db.query(models.Category).all()

    return categories


@router.get(
    "/{category_id}",
    response_model=schemas.CategoryResponse
)
async def get_category_by_id(
    category_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a single category by ID.

    This endpoint is public.
    """

    category = db.query(models.Category).filter(
        models.Category.id == category_id
    ).first()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    return category


@router.put(
    "/{category_id}",
    response_model=schemas.CategoryResponse
)
async def update_category(
    category_id: int,
    category_update: schemas.CategoryUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """
    Update a category by ID.

    Only admin users can update categories.
    """

    category = db.query(models.Category).filter(
        models.Category.id == category_id
    ).first()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    if category_update.name is not None:
        existing_category = db.query(models.Category).filter(
            models.Category.name == category_update.name,
            models.Category.id != category_id
        ).first()

        if existing_category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category name already exists"
            )

        category.name = category_update.name

    if category_update.description is not None:
        category.description = category_update.description

    db.commit()
    db.refresh(category)

    return category


@router.delete(
    "/{category_id}",
    status_code=status.HTTP_200_OK
)
async def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """
    Delete a category by ID.

    Only admin users can delete categories.
    """

    category = db.query(models.Category).filter(
        models.Category.id == category_id
    ).first()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    products_using_category = db.query(models.Product).filter(
        models.Product.category_id == category_id
    ).first()

    if products_using_category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete category because products are using it"
        )

    db.delete(category)
    db.commit()

    return {
        "message": "Category deleted successfully"
    }