from fastapi import FastAPI

from app.database import Base, engine
from app import models
from app.routers import auth, users, categories, products, orders


# Create database tables using SQLAlchemy models
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="E-Commerce Inventory API",
    version="1.0.0",
    description=(
        "A production-ready FastAPI project for managing users, "
        "categories, products, inventory, and customer orders."
    )
)


# Register API routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(orders.router)


@app.get("/")
async def root():
    return {
        "message": "Welcome to the E-Commerce Inventory API",
        "status": "running",
        "docs": "/docs",
        "redoc": "/redoc"
    }