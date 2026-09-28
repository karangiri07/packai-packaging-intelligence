from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.food import FoodProduct
from app.schemas.food import FoodCreate, FoodUpdate


def list_foods(db: Session):
    return db.query(FoodProduct).order_by(FoodProduct.name.asc()).all()


def get_food(db: Session, food_id: int) -> FoodProduct:
    food = db.query(FoodProduct).filter(FoodProduct.id == food_id).first()
    if not food:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Food product not found")
    return food


def create_food(db: Session, payload: FoodCreate) -> FoodProduct:
    food = FoodProduct(**payload.model_dump(), is_custom=True)
    db.add(food)
    db.commit()
    db.refresh(food)
    return food


def update_food(db: Session, food_id: int, payload: FoodUpdate) -> FoodProduct:
    food = get_food(db, food_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(food, field, value)
    db.commit()
    db.refresh(food)
    return food


def delete_food(db: Session, food_id: int) -> None:
    food = get_food(db, food_id)
    db.delete(food)
    db.commit()
