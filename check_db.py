import sys
print("Starting...")
from app.database import SessionLocal, engine
from app import models
print("Imported OK")
db = SessionLocal()
try:
    cats = db.query(models.Category).all()
    print(f"Categories ({len(cats)}):", [(c.id, c.name) for c in cats])
    prods = db.query(models.Product).all()
    print(f"Products ({len(prods)}):", [(p.id, p.name, p.category_id, p.stock_quantity, p.price) for p in prods])
finally:
    db.close()
print("Done")
