from app.auth import hash_password
from app.database import SessionLocal
from app.models import User


def seed_admin():
    db = SessionLocal()

    try:
        existing_admin = db.query(User).filter(
            User.username == "admin"
        ).first()

        if existing_admin:
            existing_admin.role = "admin"
            db.commit()

            print("Admin user already exists.")
            print("Existing user has been confirmed as admin.")
            return

        admin_user = User(
            full_name="Admin User",
            email="admin@example.com",
            username="admin",
            hashed_password=hash_password("admin123"),
            role="admin",
            is_active=True
        )

        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

        print("Admin user created successfully.")
        print("Username: admin")
        print("Password: admin123")

    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()