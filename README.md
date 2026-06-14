# E-Commerce Inventory API — Group 10 BSEM1201

## Project Overview

This project is a full-stack e-commerce inventory management system built for the Object-Oriented Programming 2 course. The system allows customers to browse products, register, login, place orders, and track their order status. It also gives administrators full control over products, categories, users, orders, customer messages, inventory health, payment tracking, and stock management.

The system was designed to solve common e-commerce problems such as poor inventory tracking, unpaid pending orders, low stock visibility, and manual order management.

## Main Features

### Customer Features

* User registration and login
* Product browsing
* Product category filtering
* Product search and price filtering
* Product details page
* Add to cart functionality
* Place orders with payment method
* View personal orders
* Cancel pending orders
* Submit product reviews
* Send contact messages

### Admin Features

* Admin dashboard
* View inventory health
* View total products, categories, orders, and revenue
* Add, edit, and delete products
* Upload or replace product images
* Add, edit, and delete categories
* View all customer orders
* Mark pending orders as paid
* Cancel pending orders
* Auto-cancel unpaid pending orders
* Restore stock when orders are cancelled
* View all users
* Delete users
* View customer contact messages
* Mark messages as read
* View restock recommendations

## Technologies Used

### Backend

* Python
* FastAPI
* SQLAlchemy
* Pydantic
* JWT Authentication
* PostgreSQL / SQLite support
* Uvicorn

### Frontend

* HTML
* CSS
* JavaScript

## Object-Oriented Programming Concepts Used

This project applies object-oriented programming principles through the use of structured models, schemas, routers, and reusable functions.

### Classes and Models

The system uses model classes such as:

* User
* Product
* Category
* Order
* OrderItem
* Review
* ContactMessage

These models represent real-world entities in the e-commerce system.

### Encapsulation

Database fields, validation rules, and response schemas are separated into different files. This keeps the system organized and easier to maintain.

### Reusability

Common functions such as stock restoration, order formatting, payment handling, authentication, and dashboard calculations are reused across different routes.

### Modularity

The system is divided into different modules:

* auth.py
* users.py
* products.py
* categories.py
* orders.py
* reviews.py
* contact.py
* upload.py
* models.py
* schemas.py
* database.py
* main.py

Each module handles a specific part of the system.

## How to Run the Project

### 1. Install Requirements

```bash
pip install -r requirements.txt
```

### 2. Run the Server

```bash
uvicorn app.main:app --reload
```

### 3. Open the Website

Open the browser and visit:

```text
http://127.0.0.1:8000
```

### 4. Open API Documentation

FastAPI automatically provides API documentation at:

```text
http://127.0.0.1:8000/docs
```

## Admin Workflow

The admin can login and manage the whole system from the dashboard. The admin can add new products, update stock, view low-stock products, manage customer orders, mark orders as paid, cancel unpaid orders, and monitor customer messages.

One important feature is the auto-cancel unpaid orders system. This allows the admin to automatically cancel pending unpaid orders after a selected time. When an order is cancelled, the product stock is restored automatically.

## Customer Workflow

A customer can create an account, login, browse products, add items to the cart, place an order, and view their order history. Customers can also cancel pending orders and send messages through the contact form.

## Unique Features

* Inventory health dashboard
* Restock recommendation system
* Auto-cancel unpaid orders
* Automatic stock restoration after cancellation
* Admin payment confirmation
* Product review system
* Contact message management
* Full customer and admin interface
* API documentation through Swagger UI

## Group Information

**Group:** Group 10
**Program:** BSEM1201
**Course:** Object-Oriented Programming 2
**Project:** E-Commerce Inventory API
