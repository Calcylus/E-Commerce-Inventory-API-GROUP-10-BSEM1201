"""Add more categories and products with matching images."""
from app.database import SessionLocal
from app.models import Category, Product

db = SessionLocal()

try:
    # ── Additional categories ──
    extra_categories = [
        {"name": "Audio & Sound", "description": "Speakers, microphones, and audio gear", "icon": "🎧"},
        {"name": "Camera & Photo", "description": "Cameras, lenses, and photography accessories", "icon": "📷"},
        {"name": "Networking", "description": "Routers, cables, and network equipment", "icon": "🌐"},
        {"name": "Gaming", "description": "Consoles, controllers, and gaming accessories", "icon": "🎮"},
    ]
    for cat in extra_categories:
        existing = db.query(Category).filter(Category.name == cat["name"]).first()
        if not existing:
            db.add(Category(name=cat["name"], description=cat["description"], icon=cat["icon"]))
            print(f"  Created category: {cat['name']}")
        else:
            print(f"  Skipped (exists): {cat['name']}")
    db.commit()

    # Refresh category map
    cat_map = {c.name: c.id for c in db.query(Category).all()}

    # ── Additional products ──
    products = [
        # Existing 10 will be skipped (they already exist)
        {"name": "Wireless Mouse", "price": 25.99, "stock": 48, "cat": "Computer Accessories",
         "image": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=300&fit=crop"},
        {"name": "Bluetooth Headphones", "price": 45.50, "stock": 30, "cat": "Electronics",
         "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop"},
        {"name": "USB-C Charger", "price": 18.75, "stock": 60, "cat": "Mobile Accessories",
         "image": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&h=300&fit=crop"},
        {"name": "Gaming Keyboard", "price": 65.00, "stock": 20, "cat": "Computer Accessories",
         "image": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=300&fit=crop"},
        {"name": "Smart Watch", "price": 80.00, "stock": 15, "cat": "Electronics",
         "image": "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=300&fit=crop"},
        {"name": "Laptop Stand", "price": 32.99, "stock": 25, "cat": "Office Equipment",
         "image": "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=300&fit=crop"},
        {"name": "External Hard Drive", "price": 72.40, "stock": 12, "cat": "Computer Accessories",
         "image": "https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=400&h=300&fit=crop"},
        {"name": "Phone Tripod", "price": 22.00, "stock": 35, "cat": "Mobile Accessories",
         "image": "https://images.unsplash.com/photo-1585829365295-7c2c6e2c0a1e?w=400&h=300&fit=crop"},
        {"name": "LED Desk Lamp", "price": 28.60, "stock": 18, "cat": "Office Equipment",
         "image": "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=400&h=300&fit=crop"},
        {"name": "Power Bank", "price": 35.99, "stock": 40, "cat": "Mobile Accessories",
         "image": "https://images.unsplash.com/photo-1609592424848-c9e8b2f6c4d4?w=400&h=300&fit=crop"},
        # ── NEW products (16 more) ──
        {"name": "Wireless Speaker", "price": 55.00, "stock": 22, "cat": "Audio & Sound",
         "image": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=300&fit=crop"},
        {"name": "USB Microphone", "price": 49.99, "stock": 14, "cat": "Audio & Sound",
         "image": "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&h=300&fit=crop"},
        {"name": "Webcam HD", "price": 39.99, "stock": 28, "cat": "Computer Accessories",
         "image": "https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=400&h=300&fit=crop"},
        {"name": "DSLR Camera", "price": 499.00, "stock": 5, "cat": "Camera & Photo",
         "image": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop"},
        {"name": "Camera Lens 50mm", "price": 175.00, "stock": 8, "cat": "Camera & Photo",
         "image": "https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=400&h=300&fit=crop"},
        {"name": "Wi-Fi Router", "price": 89.99, "stock": 17, "cat": "Networking",
         "image": "https://images.unsplash.com/photo-1573167507387-6b4b98cb7c13?w=400&h=300&fit=crop"},
        {"name": "Ethernet Cable 10m", "price": 12.99, "stock": 50, "cat": "Networking",
         "image": "https://images.unsplash.com/photo-1624431666270-7e3c2b162d74?w=400&h=300&fit=crop"},
        {"name": "Gaming Mouse Pad", "price": 19.99, "stock": 33, "cat": "Gaming",
         "image": "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=300&fit=crop"},
        {"name": "USB Hub 4-Port", "price": 14.99, "stock": 45, "cat": "Computer Accessories",
         "image": "https://images.unsplash.com/photo-1617791160536-598cf32026fb?w=400&h=300&fit=crop"},
        {"name": "Monitor Stand", "price": 42.00, "stock": 11, "cat": "Office Equipment",
         "image": "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=300&fit=crop"},
        {"name": "Noise Cancelling Earbuds", "price": 69.99, "stock": 19, "cat": "Audio & Sound",
         "image": "https://images.unsplash.com/photo-1590658268037-6bf12f032f65?w=400&h=300&fit=crop"},
        {"name": "HDMI Cable 3m", "price": 9.99, "stock": 70, "cat": "Networking",
         "image": "https://images.unsplash.com/photo-1624431666270-7e3c2b162d74?w=400&h=300&fit=crop"},
        {"name": "Wireless Charger Pad", "price": 24.99, "stock": 38, "cat": "Mobile Accessories",
         "image": "https://images.unsplash.com/photo-1586810724476-c294fb7ac01b?w=400&h=300&fit=crop"},
        {"name": "Mechanical Keyboard", "price": 89.99, "stock": 9, "cat": "Gaming",
         "image": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=300&fit=crop"},
        {"name": "Laptop Backpack", "price": 44.99, "stock": 21, "cat": "Office Equipment",
         "image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop"},
        {"name": "Action Camera", "price": 199.00, "stock": 7, "cat": "Camera & Photo",
         "image": "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=300&fit=crop"},
    ]

    created = 0
    skipped = 0
    updated = 0

    for p in products:
        existing = db.query(Product).filter(Product.name == p["name"]).first()
        data = {
            "name": p["name"],
            "description": f"High-quality {p['name'].lower()} — perfect for daily use.",
            "price": p["price"],
            "stock_quantity": p["stock"],
            "category_id": cat_map[p["cat"]],
            "image_url": p["image"],
        }
        if existing:
            # Update image_url if missing
            if not existing.image_url:
                for k, v in data.items():
                    setattr(existing, k, v)
                updated += 1
            else:
                skipped += 1
        else:
            db.add(Product(**data))
            created += 1

    db.commit()

    total = db.query(Product).count()
    print(f"\nDone! {created} created, {updated} updated, {skipped} skipped.")
    print(f"Total products now: {total}")
    print(f"Total categories: {db.query(Category).count()}")

finally:
    db.close()
