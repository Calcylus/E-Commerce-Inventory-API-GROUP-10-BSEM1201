# E-Commerce Inventory API

This is a FastAPI-based E-Commerce Inventory API developed for **PROG315 - Object-Oriented Programming 2** at **Limkokwing University Sierra Leone**.

The API allows users to register, log in, manage products, manage categories, create orders, track inventory stock, detect risky orders, generate sales summaries, and receive smart restock recommendations.

---

## Project Overview

The purpose of this project is to build a production-ready RESTful API for managing an e-commerce inventory system.

The system supports:

- User registration and login
- JWT authentication
- Role-based access control
- Category management
- Product inventory management
- Product search and filtering
- Order creation
- Order item tracking
- Automatic stock reduction after orders
- Low-stock product checking
- Inventory health dashboard
- Smart stock restock recommendations
- Order risk detection
- Sales summary dashboard
- Swagger UI and ReDoc documentation

---

## Tech Stack

- Python
- FastAPI
- PostgreSQL
- SQLAlchemy ORM
- Pydantic v2
- JWT Authentication
- Uvicorn
- Passlib with bcrypt
- Python-Jose
- Python-dotenv
- SQLTools / PostgreSQL tools in VS Code

---

## Project Structure

```text
E-Commerce Inventory-api/
├── app/
│   ├── __init__.py
│   ├── auth.py
│   ├── database.py
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   └── routers/
│       ├── __init__.py
│       ├── auth.py
│       ├── users.py
│       ├── categories.py
│       ├── products.py
│       └── orders.py
│
├── .env
├── .gitignore
├── README.md
└── requirements.txt
Main Features
Authentication
Register new users
Login with username and password
Generate JWT access token
Protect routes using OAuth2 Bearer token
Admin-only route protection
Users
View current user profile
Admin can view all users
Admin can view a single user
Admin can delete users
Categories
Public can view categories
Admin can create categories
Admin can update categories
Admin can delete categories
Products
Public can view products
Admin can create products
Admin can update products
Admin can delete products
Admin can check low-stock products
Users can search and filter products
Orders
Logged-in users can create orders
Users can view their own orders
Admin can view all orders
Admin can update order status
Product stock reduces automatically after an order
Unique API Features

This project includes extra business-focused features to make the API more practical and intelligent.

1. Inventory Health Dashboard

Endpoint:

GET /products/inventory/health

This endpoint gives admins a quick overview of the inventory system.

It shows:

Total products
Total categories
Total orders
Low-stock products
Out-of-stock products
Total inventory value
Inventory health message

Example response:

{
  "total_products": 1,
  "total_categories": 1,
  "total_orders": 1,
  "low_stock_products": 0,
  "out_of_stock_products": 0,
  "total_inventory_value": 1247.52,
  "message": "Inventory health looks good."
}
2. Smart Stock Recommendation

Endpoint:

GET /products/restock-recommendations

This endpoint checks products with low stock and recommends how many units should be restocked.

Example:

[
  {
    "product_id": 1,
    "product_name": "Wireless Mouse",
    "current_stock": 48,
    "recommended_restock_quantity": 52,
    "reason": "Wireless Mouse has only 48 units left. Restock 52 units to reach the target stock of 100."
  }
]
3. Product Search and Filter

Endpoint:

GET /products/search

Users can search products by:

Keyword
Category ID
Minimum price
Maximum price
Stock status

Example:

/products/search?keyword=mouse&min_price=10&max_price=50&stock_status=in_stock
4. Order Risk Detection

Endpoint:

POST /orders/check-risk

This endpoint checks an order before it is placed and warns if the order may reduce stock below a safe level.

Example request:

{
  "items": [
    {
      "product_id": 1,
      "quantity": 45
    }
  ]
}

Example response:

{
  "is_risky": true,
  "total_estimated_amount": 1169.55,
  "risk_items": [
    {
      "product_id": 1,
      "product_name": "Wireless Mouse",
      "requested_quantity": 45,
      "current_stock": 48,
      "stock_after_order": 3,
      "risk_level": "MEDIUM",
      "message": "This order will reduce stock below the safe level of 10."
    }
  ],
  "message": "Risk detected. Review the order before confirming."
}
5. Sales Summary Dashboard

Endpoint:

GET /orders/sales/summary

This endpoint gives admins a quick sales performance summary.

It shows:

Total orders
Pending orders
Completed orders
Cancelled orders
Total revenue
Sales message

Example response:

{
  "total_orders": 1,
  "pending_orders": 0,
  "completed_orders": 1,
  "cancelled_orders": 0,
  "total_revenue": 51.98,
  "message": "Sales summary generated successfully."
}
API Endpoints
Authentication
Method	Endpoint	Description
POST	/auth/register	Register a new user
POST	/auth/login	Login and receive JWT token
Users
Method	Endpoint	Description
GET	/users/me	Get current logged-in user
GET	/users/	Get all users, admin only
GET	/users/{user_id}	Get user by ID, admin only
DELETE	/users/{user_id}	Delete user, admin only
Categories
Method	Endpoint	Description
POST	/categories/	Create category, admin only
GET	/categories/	Get all categories
GET	/categories/{category_id}	Get category by ID
PUT	/categories/{category_id}	Update category, admin only
DELETE	/categories/{category_id}	Delete category, admin only
Products
Method	Endpoint	Description
POST	/products/	Create product, admin only
GET	/products/	Get all products
GET	/products/search	Search and filter products
GET	/products/low-stock	Get low-stock products, admin only
GET	/products/inventory/health	Get inventory health dashboard, admin only
GET	/products/restock-recommendations	Get smart restock recommendations, admin only
GET	/products/{product_id}	Get product by ID
PUT	/products/{product_id}	Update product, admin only
DELETE	/products/{product_id}	Delete product, admin only
Orders
Method	Endpoint	Description
POST	/orders/	Create order
POST	/orders/check-risk	Check order risk before placing order
GET	/orders/sales/summary	Get sales summary dashboard, admin only
GET	/orders/my-orders	Get current user's orders
GET	/orders/	Get all orders, admin only
GET	/orders/{order_id}	Get order by ID
PUT	/orders/{order_id}/status	Update order status, admin only
Installation Guide
1. Clone the repository
git clone your_repository_link_here
cd E-Commerce-Inventory-api
2. Create a virtual environment
python -m venv venv
3. Activate the virtual environment

For Windows PowerShell:

venv\Scripts\Activate.ps1

For Command Prompt:

venv\Scripts\activate
4. Install dependencies
pip install -r requirements.txt
5. Create PostgreSQL database

Create a PostgreSQL database named:

ecommerce_inventory_db
6. Create .env file

Create a .env file in the root folder and add:

DATABASE_URL=postgresql://postgres:your_password@localhost:5432/ecommerce_inventory_db

SECRET_KEY=change_this_to_a_long_random_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

PROJECT_NAME=E-Commerce Inventory API
PROJECT_VERSION=1.0.0

Replace your_password with your PostgreSQL password.

## Run the Backend

From the project root folder, run:

```bash
uvicorn app.main:app --reload
```

The backend API will run at:

```text
http://127.0.0.1:8000
```

Swagger UI:

```text
http://127.0.0.1:8000/docs
```

ReDoc:

```text
http://127.0.0.1:8000/redoc
```

---

## Run the Frontend

Open a second terminal and move into the frontend folder:

```bash
cd frontend
```

Install frontend dependencies:

```bash
npm install
```

Start the React development server:

```bash
npm run dev
```

The frontend dashboard will run at:

```text
http://localhost:5173
```

---

## Running Full Project

To run the full system:

```text
Terminal 1 → Backend
uvicorn app.main:app --reload

Terminal 2 → Frontend
cd frontend
npm run dev
```

The backend must be running before logging into the frontend.

Testing Workflow

Recommended testing order:

Register a user using /auth/register
Promote the user to admin in PostgreSQL
Login using /auth/login
Authorize in Swagger UI
Create a category
Create a product
Create an order
Check product stock reduction
Update order status
Test inventory health dashboard
Test restock recommendations
Test product search and filter
Test order risk detection
Test sales summary dashboard
Example Test Data
Register User
{
  "full_name": "Admin Bob",
  "email": "adminbob@example.com",
  "username": "admin",
  "password": "admin123"
}
Create Category
{
  "name": "Electronics",
  "description": "Electronic devices and accessories"
}
Create Product
{
  "name": "Wireless Mouse",
  "description": "A smooth wireless mouse for computers",
  "price": 25.99,
  "stock_quantity": 50,
  "category_id": 1
}
Create Order
{
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    }
  ]
}
Check Order Risk
{
  "items": [
    {
      "product_id": 1,
      "quantity": 45
    }
  ]
}
Async Feature

The project includes asynchronous endpoints using async and await.

Example endpoint:

GET /products/low-stock

The low-stock endpoint uses asynchronous behavior to demonstrate async programming in FastAPI.

Example:

await asyncio.sleep(0.1)

Other dashboard-style endpoints also use async route functions to fit FastAPI's asynchronous API design.

Object-Oriented Programming Relevance

Although FastAPI uses functions for route handlers, this project applies object-oriented programming concepts through:

SQLAlchemy ORM model classes
Pydantic schema classes
Encapsulation of database tables into model classes
Reusable authentication helper functions
Modular router-based design
Separation of concerns between models, schemas, routers, authentication, and database configuration

The API structure keeps the project organized, reusable, and easier to maintain.

SDG Relevance

This project supports SDG 8: Decent Work and Economic Growth and SDG 9: Industry, Innovation and Infrastructure.

SDG 8

The API helps small and medium-sized businesses manage products, orders, and inventory more efficiently. This can support business growth, reduce manual errors, and improve productivity.

SDG 9

The project encourages digital innovation by using modern API technology, database integration, authentication, and automated documentation. It supports the development of scalable digital infrastructure for e-commerce systems.

Sierra Leone Problem Relevance

Many small businesses in Sierra Leone still manage stock manually using books, paper records, or basic spreadsheets. This can lead to:

Lost records
Wrong stock counts
Poor order tracking
Slow business decisions
Difficulty scaling online sales

This E-Commerce Inventory API provides a digital solution that can help local shops and online sellers manage products, stock, categories, and customer orders more reliably.

The unique dashboard and recommendation features are useful for local business owners because they provide quick decision-making support, not just record keeping.

Security Features
Passwords are hashed before storage
JWT tokens are used for login sessions
Protected routes require authentication
Admin-only routes require authorization
.env is ignored by Git to protect secrets
Role-based access control protects sensitive admin features
Open Source License

This project should use a recognized open-source license such as:

MIT License

The license file should be added to the GitHub repository as:

LICENSE
GitHub Submission Notes

Before submission:

Push all source code to GitHub
Add a recognized open-source license
Add the lecturer as collaborator if required
Make sure .env and venv/ are not uploaded
Include screenshots of Swagger UI
Include endpoint testing evidence
Keep commit messages clear and meaningful

Example commit messages:

Initial project setup
Add database configuration
Add SQLAlchemy models
Add Pydantic schemas
Add JWT authentication
Add authentication routes
Add user routes
Add category routes
Add product routes
Add order routes
Add async low stock endpoint
Add inventory health dashboard
Add smart restock recommendations
Add product search and filtering
Add order risk detection
Add sales summary dashboard
Update README documentation
Author

Developed for PROG315 - Object-Oriented Programming 2
Limkokwing University Sierra Leone