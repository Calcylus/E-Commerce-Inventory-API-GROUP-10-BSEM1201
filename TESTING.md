# API Testing Guide

This file explains how to test the E-Commerce Inventory API using Swagger UI.

## 1. Start the Server

Run:

```bash
uvicorn app.main:app --reload

Open Swagger UI:

http://127.0.0.1:8000/docs
2. Create Admin User

Run the admin seed script:

python seed_admin.py

Expected result:

Admin user created successfully.
Username: admin
Password: admin123

Or:

Admin user already exists.
Existing user has been confirmed as admin.
3. Login

Go to:

POST /auth/login

Use:

username: admin
password: admin123

Copy the access token if needed.

You can also click the Authorize button in Swagger and log in using the same details.

4. Create Category

Go to:

POST /categories/

Request body:

{
  "name": "Electronics",
  "description": "Electronic devices and accessories"
}

Expected status:

201 Created
5. Create Product

Go to:

POST /products/

Request body:

{
  "name": "Wireless Mouse",
  "description": "A smooth wireless mouse for computers",
  "price": 25.99,
  "stock_quantity": 50,
  "category_id": 1
}

Expected status:

201 Created
6. Create Order

Go to:

POST /orders/

Request body:

{
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    }
  ]
}

Expected result:

Order is created
Total amount is calculated
Product stock is reduced
7. Test Product Search

Go to:

GET /products/search

Example query:

keyword=mouse
min_price=10
max_price=50
stock_status=in_stock

Expected status:

200 OK
8. Test Inventory Health Dashboard

Go to:

GET /products/inventory/health

Expected example response:

{
  "total_products": 1,
  "total_categories": 1,
  "total_orders": 1,
  "low_stock_products": 0,
  "out_of_stock_products": 0,
  "total_inventory_value": 1247.52,
  "message": "Inventory health looks good."
}
9. Test Restock Recommendation

Go to:

GET /products/restock-recommendations

Use:

low_stock_limit=50
target_stock=100

Expected result:

[
  {
    "product_id": 1,
    "product_name": "Wireless Mouse",
    "current_stock": 48,
    "recommended_restock_quantity": 52,
    "reason": "Wireless Mouse has only 48 units left. Restock 52 units to reach the target stock of 100."
  }
]
10. Test Order Risk Detection

Go to:

POST /orders/check-risk

Use:

safe_stock_level=10

Request body:

{
  "items": [
    {
      "product_id": 1,
      "quantity": 45
    }
  ]
}

Expected result:

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
11. Update Order Status

Go to:

PUT /orders/{order_id}/status

Example body:

{
  "status": "completed"
}

Allowed statuses:

pending
completed
cancelled
12. Test Sales Summary

Go to:

GET /orders/sales/summary

Expected example response:

{
  "total_orders": 1,
  "pending_orders": 0,
  "completed_orders": 1,
  "cancelled_orders": 0,
  "total_revenue": 51.98,
  "message": "Sales summary generated successfully."
}
13. Database Check

Using SQLTools in VS Code, check these tables:

users
categories
products
orders
order_items

Expected records:

users       → admin user
categories  → Electronics
products    → Wireless Mouse
orders      → created order
order_items → ordered product details
Final Testing Checklist
[ ] Server starts successfully
[ ] Swagger UI loads
[ ] Admin seed script works
[ ] Login works
[ ] JWT authorization works
[ ] Category creation works
[ ] Product creation works
[ ] Order creation works
[ ] Product stock reduces after order
[ ] Product search works
[ ] Inventory health dashboard works
[ ] Restock recommendation works
[ ] Order risk detection works
[ ] Sales summary works
[ ] SQLTools shows database records