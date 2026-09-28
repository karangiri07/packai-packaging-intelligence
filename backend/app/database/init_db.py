"""
Creates all tables and seeds the database with demo food and packaging data
if those tables are empty. Safe to call on every startup.
"""
import json
from pathlib import Path

from sqlalchemy.orm import Session
from sqlalchemy import inspect, text

from app.database.session import Base, engine, SessionLocal
from app.models import user, food, packaging, analysis, packaging_score, recommendation, report  # noqa: F401
from app.models.food import FoodProduct
from app.models.packaging import PackagingMaterial

DATA_DIR = Path(__file__).resolve().parents[3] / "data"


def create_all_tables():
    Base.metadata.create_all(bind=engine)


def seed_foods(db: Session):
    if db.query(FoodProduct).count() > 0:
        return
    path = DATA_DIR / "foods.json"
    if not path.exists():
        return
    items = json.loads(path.read_text())
    for item in items:
        db.add(FoodProduct(**item))
    db.commit()


def seed_packaging(db: Session):
    if db.query(PackagingMaterial).count() > 0:
        return
    path = DATA_DIR / "packaging.json"
    if not path.exists():
        return
    items = json.loads(path.read_text())
    for item in items:
        db.add(PackagingMaterial(**item))
    db.commit()


def migrate_schema():
    inspector = inspect(engine)
    if "analyses" in inspector.get_table_names():
        columns = {c["name"] for c in inspector.get_columns("analyses")}
        if "current_packaging_id" not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE analyses ADD COLUMN current_packaging_id INTEGER"))


def init_and_seed():
    create_all_tables()
    migrate_schema()
    db = SessionLocal()
    try:
        seed_foods(db)
        seed_packaging(db)
    finally:
        db.close()


if __name__ == "__main__":
    init_and_seed()
    print("Database initialized and seeded.")
