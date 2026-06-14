"""Update product images with better-matched Unsplash photos.

Source: unsplash.com - all photos are free to use under the Unsplash License.
"""
from app.database import SessionLocal
from app.models import Product

W = "w=500&h=500&fit=crop"

db = SessionLocal()

try:
    products = db.query(Product).all()
    name_map = {p.name: p for p in products}

    updates = {
        # Already correct - keep
        "Wireless Mouse": f"https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?{W}",
        "Bluetooth Headphones": f"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?{W}",
        "USB-C Charger": f"https://images.unsplash.com/photo-1583863788434-e58a36330cf0?{W}",
        "Gaming Keyboard": f"https://images.unsplash.com/photo-1587829741301-dc798b83add3?{W}",
        "Smart Watch": f"https://images.unsplash.com/photo-1524592094714-0f0654e20314?{W}",
        "LED Desk Lamp": f"https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?{W}",
        "Power Bank": f"https://images.unsplash.com/photo-1609592424848-c9e8b2f6c4d4?{W}",
        "Wireless Speaker": f"https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?{W}",
        "DSLR Camera": f"https://images.unsplash.com/photo-1516035069371-29a1b244cc32?{W}",
        "Camera Lens 50mm": f"https://images.unsplash.com/photo-1617005082133-548c4dd27f35?{W}",
        "Ethernet Cable 10m": f"https://images.unsplash.com/photo-1624431666270-7e3c2b162d74?{W}",
        "Noise Cancelling Earbuds": f"https://images.unsplash.com/photo-1590658268037-6bf12f032f65?{W}",
        "HDMI Cable 3m": f"https://images.unsplash.com/photo-1619954826680-117e65e7fd87?{W}",
        "Laptop Backpack": f"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?{W}",
        "Action Camera": f"https://images.unsplash.com/photo-1502920917128-1aa500764cbd?{W}",

        # FIXED: completely different photos from search results

        # Laptop Stand -> laptop on a stand
        "Laptop Stand": f"https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?{W}",

        # External Hard Drive -> hard drive on wooden table
        "External Hard Drive": f"https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?{W}",

        # Phone Tripod -> phone mounted on tripod
        "Phone Tripod": f"https://images.unsplash.com/photo-1616423641413-1a6db6f5b9b3?{W}",

        # USB Microphone -> studio microphone
        "USB Microphone": f"https://images.unsplash.com/photo-1590602847861-f357a9332bbc?{W}",

        # Webcam HD -> webcam / security camera
        "Webcam HD": f"https://images.unsplash.com/photo-1587826080692-f439cd0b70da?{W}",

        # Wi-Fi Router -> white router on white table
        "Wi-Fi Router": f"https://images.unsplash.com/photo-1606904825846-647eb07f5be2?{W}",

        # Gaming Mouse Pad -> mouse on mouse pad
        "Gaming Mouse Pad": f"https://images.unsplash.com/photo-1616588589676-62b3bd4ff6d2?{W}",

        # USB Hub 4-Port -> black usb hub with multiple ports
        "USB Hub 4-Port": f"https://images.unsplash.com/photo-1625842268584-8f3296236761?{W}",

        # Monitor Stand -> monitor on a desk
        "Monitor Stand": f"https://images.unsplash.com/photo-1593642702749-b7d2a804fbcf?{W}",

        # Wireless Charger Pad -> white round wireless charger
        "Wireless Charger Pad": f"https://images.unsplash.com/photo-1591290619762-d2d61c1a8c70?{W}",

        # Mechanical Keyboard -> keyboard with colorful rgb lighting
        "Mechanical Keyboard": f"https://images.unsplash.com/photo-1595044426077-d36d9236d54a?{W}",
    }

    count = 0
    for name, url in updates.items():
        p = name_map.get(name)
        if p:
            p.image_url = url
            count += 1

    db.commit()
    print(f"Updated {count} product images.")

    # Verify
    for p in db.query(Product).order_by(Product.id).all():
        flag = "❌" if not p.image_url else "..."
        print(f"  #{p.id:2d} {p.name:30s} {flag}")

finally:
    db.close()