from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_admin, get_current_user
from app.database import get_db


router = APIRouter(
    prefix="/contact",
    tags=["Contact"]
)


@router.post(
    "/",
    response_model=schemas.ContactResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_contact_message(
    contact: schemas.ContactCreate,
    db: Session = Depends(get_db)
):
    """
    Submit a contact/help message. Public endpoint.
    """

    msg = models.ContactMessage(
        name=contact.name,
        email=contact.email,
        subject=contact.subject,
        message=contact.message
    )

    db.add(msg)
    db.commit()
    db.refresh(msg)

    return msg


@router.get(
    "/",
    response_model=List[schemas.ContactResponse]
)
async def get_contact_messages(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """
    Get all contact messages with pagination (admin only).
    """

    messages = db.query(models.ContactMessage).order_by(
        models.ContactMessage.created_at.desc()
    ).offset(skip).limit(limit).all()

    return messages


@router.put(
    "/{message_id}/read",
    response_model=schemas.ContactResponse
)
async def mark_message_read(
    message_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """
    Mark a contact message as read (admin only).
    """

    msg = db.query(models.ContactMessage).filter(
        models.ContactMessage.id == message_id
    ).first()

    if not msg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )

    msg.is_read = True
    db.commit()
    db.refresh(msg)

    return msg
