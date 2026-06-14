import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import Base, engine
from app import models
from app.routers import auth, users, categories, products, orders, contact, reviews, upload


# Create database tables using SQLAlchemy models
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="E-Commerce Inventory API",
    version="1.0.0",
    description=(
        "A production-ready FastAPI project for managing users, "
        "categories, products, inventory, customer orders, "
        "stock recommendations, order risk detection, and sales analytics."
    )
)


# Allow frontend to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register API routers under /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(contact.router, prefix="/api")
app.include_router(reviews.router, prefix="/api")
app.include_router(upload.router, prefix="/api")


# Serve frontend static files
frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend")
app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")

# Serve uploaded files
uploads_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")
