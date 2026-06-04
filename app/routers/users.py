from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_admin, get_current_user
from app.database import get_db


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get(
    "/me",
    response_model=schemas.UserResponse
)
async def get_my_profile(
    current_user: models.User = Depends(get_current_user)
):
    """
    Get the profile of the currently logged-in user.
    """

    return current_user


@router.get(
    "/",
    response_model=List[schemas.UserResponse]
)
async def get_all_users(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """
    Get all users.

    Only admin users can access this endpoint.
    """

    users = db.query(models.User).all()

    return users


@router.get(
    "/{user_id}",
    response_model=schemas.UserResponse
)
async def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """
    Get a single user by ID.

    Only admin users can access this endpoint.
    """

    user = db.query(models.User).filter(
        models.User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_200_OK
)
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """
    Delete a user by ID.

    Only admin users can delete users.
    """

    user = db.query(models.User).filter(
        models.User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own admin account"
        )

    db.delete(user)
    db.commit()

    return {
        "message": "User deleted successfully"
    }