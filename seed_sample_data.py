from app.database import SessionLocal
from app.models import Category, Product


def seed_sample_data():
    db = SessionLocal()

    try:
        categories_data = [
            {
                "name": "Electronics",
                "description": "Electronic devices and smart gadgets",
            },
            {
                "name": "Computer Accessories",
                "description": "Accessories for laptops and desktop computers",
            },
            {
                "name": "Mobile Accessories",
                "description": "Useful accessories for mobile phones",
            },
            {
                "name": "Office Equipment",
                "description": "Equipment and tools for office productivity",
            },
        ]

        created_categories = {}

        for category_data in categories_data:
            existing_category = db.query(Category).filter(
                Category.name == category_data["name"]
            ).first()

            if existing_category:
                created_categories[category_data["name"]] = existing_category
            else:
                new_category = Category(
                    name=category_data["name"],
                    description=category_data["description"],
                )
                db.add(new_category)
                db.commit()
                db.refresh(new_category)
                created_categories[category_data["name"]] = new_category

        products_data = [
            {
                "name": "Wireless Mouse",
                "description": "A smooth wireless mouse for computers",
                "price": 25.99,
                "stock_quantity": 48,
                "category": "Computer Accessories",
            },
            {
                "name": "Bluetooth Headphones",
                "description": "Wireless headphones with clear sound and deep bass",
                "price": 45.50,
                "stock_quantity": 30,
                "category": "Electronics",
            },
            {
                "name": "USB-C Charger",
                "description": "Fast charging USB-C adapter for phones and tablets",
                "price": 18.75,
                "stock_quantity": 60,
                "category": "Mobile Accessories",
            },
            {
                "name": "Gaming Keyboard",
                "description": "Mechanical keyboard with RGB lighting",
                "price": 65.00,
                "stock_quantity": 20,
                "category": "Computer Accessories",
            },
            {
                "name": "Smart Watch",
                "description": "Fitness tracking smart watch with heart rate monitor",
                "price": 80.00,
                "stock_quantity": 15,
                "category": "Electronics",
            },
            {
                "name": "Laptop Stand",
                "description": "Adjustable laptop stand for better posture",
                "price": 32.99,
                "stock_quantity": 25,
                "category": "Office Equipment",
            },
            {
                "name": "External Hard Drive",
                "description": "1TB external hard drive for backups and storage",
                "price": 72.40,
                "stock_quantity": 12,
                "category": "Computer Accessories",
            },
            {
                "name": "Phone Tripod",
                "description": "Portable tripod for content creation and video calls",
                "price": 22.00,
                "stock_quantity": 35,
                "category": "Mobile Accessories",
            },
            {
                "name": "LED Desk Lamp",
                "description": "Rechargeable LED desk lamp with brightness control",
                "price": 28.60,
                "stock_quantity": 18,
                "category": "Office Equipment",
            },
            {
                "name": "Power Bank",
                "description": "10000mAh portable power bank for mobile charging",
                "price": 35.99,
                "stock_quantity": 40,
                "category": "Mobile Accessories",
            },
        ]

        created_count = 0
        skipped_count = 0

        for product_data in products_data:
            existing_product = db.query(Product).filter(
                Product.name == product_data["name"]
            ).first()

            if existing_product:
                skipped_count += 1
                continue

            category = created_categories[product_data["category"]]

            new_product = Product(
                name=product_data["name"],
                description=product_data["description"],
                price=product_data["price"],
                stock_quantity=product_data["stock_quantity"],
                category_id=category.id,
            )

            db.add(new_product)
            created_count += 1

        db.commit()

        print("Sample data seed completed.")
        print(f"Products created: {created_count}")
        print(f"Products skipped because they already exist: {skipped_count}")
        print("Categories are ready.")
        print("You can now refresh the frontend shop page.")

    finally:
        db.close()


if __name__ == "__main__":
    seed_sample_data()