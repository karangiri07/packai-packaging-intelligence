from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.food import FoodCreate, FoodOut, FoodUpdate
from app.services import food_service

router = APIRouter(prefix="/foods", tags=["Foods"])


@router.get("", response_model=List[FoodOut])
def list_foods(db: Session = Depends(get_db)):
    return food_service.list_foods(db)


@router.get("/{food_id}", response_model=FoodOut)
def get_food(food_id: int, db: Session = Depends(get_db)):
    return food_service.get_food(db, food_id)


@router.post("", response_model=FoodOut)
def create_food(payload: FoodCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return food_service.create_food(db, payload)


@router.put("/{food_id}", response_model=FoodOut)
def update_food(food_id: int, payload: FoodUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return food_service.update_food(db, food_id, payload)


@router.delete("/{food_id}")
def delete_food(food_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    food_service.delete_food(db, food_id)
    return {"detail": "Food product deleted"}
