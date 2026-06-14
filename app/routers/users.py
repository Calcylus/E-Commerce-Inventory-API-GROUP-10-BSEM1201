from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_admin, get_current_user, hash_password, verify_password
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


@router.put(
    "/me",
    response_model=schemas.UserResponse
)
async def update_my_profile(
    update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Update the profile of the currently logged-in user.
    Allows updating full_name and/or email.
    """

    if update.full_name is not None:
        current_user.full_name = update.full_name

    if update.email is not None:
        existing = db.query(models.User).filter(
            models.User.email == update.email,
            models.User.id != current_user.id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use"
            )
        current_user.email = update.email

    db.commit()
    db.refresh(current_user)

    return current_user


@router.put(
    "/me/password",
    status_code=status.HTTP_200_OK
)
async def change_my_password(
    data: schemas.PasswordChange,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Change the password of the currently logged-in user.
    Requires the current password for verification.
    """

    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    current_user.hashed_password = hash_password(data.new_password)
    db.commit()

    return {"message": "Password changed successfully"}


@router.get(
    "/",
    response_model=List[schemas.UserResponse]
)
async def get_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """
    Get all users with pagination.

    Only admin users can access this endpoint.
    """

    users = db.query(models.User).offset(skip).limit(limit).all()

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