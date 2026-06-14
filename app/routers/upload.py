import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import JSONResponse

from app.auth import get_current_admin
from app import models


router = APIRouter(
    prefix="/upload",
    tags=["Upload"]
)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_admin: models.User = Depends(get_current_admin)
):
    """
    Upload an image file. Returns the URL to access it.

    Only admin users can upload images.
    """

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed: {', '.join(ALLOWED_TYPES)}"
        )

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    ext = os.path.splitext(file.filename or "image.jpg")[1] or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    content = await file.read()

    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 5MB."
        )

    with open(filepath, "wb") as f:
        f.write(content)

    return JSONResponse({
        "url": f"/uploads/{filename}",
        "filename": filename
    })
