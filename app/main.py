from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
        "categories, products, inventory, customer orders, "
        "stock recommendations, order risk detection, and sales analytics."
    )
)


# Allow the React frontend to communicate with the FastAPI backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
        "redoc": "/redoc",
        "frontend": "http://localhost:5173"
    }