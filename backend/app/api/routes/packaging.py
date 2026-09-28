from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.packaging import PackagingCreate, PackagingOut, PackagingUpdate
from app.services import packaging_service

router = APIRouter(prefix="/packaging", tags=["Packaging"])


@router.get("", response_model=List[PackagingOut])
def list_packaging(db: Session = Depends(get_db)):
    return packaging_service.list_packaging(db)


@router.get("/{packaging_id}", response_model=PackagingOut)
def get_packaging(packaging_id: int, db: Session = Depends(get_db)):
    return packaging_service.get_packaging(db, packaging_id)


@router.post("", response_model=PackagingOut)
def create_packaging(payload: PackagingCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return packaging_service.create_packaging(db, payload)


@router.put("/{packaging_id}", response_model=PackagingOut)
def update_packaging(packaging_id: int, payload: PackagingUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return packaging_service.update_packaging(db, packaging_id, payload)
