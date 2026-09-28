"""
Standalone seed script.

Run with:  python scripts/seed_database.py
(run from the project root, with the backend's virtualenv active)

Creates all tables (if they don't exist) and seeds the foods/packaging
tables from data/foods.json and data/packaging.json if they're empty.
Safe to re-run - it will not duplicate data.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.database.init_db import init_and_seed  # noqa: E402

if __name__ == "__main__":
    init_and_seed()
    print("Database initialized and seeded with demo foods and packaging materials.")
