from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.packaging import PackagingMaterial
from app.schemas.packaging import PackagingCreate, PackagingUpdate


def list_packaging(db: Session):
    return db.query(PackagingMaterial).order_by(PackagingMaterial.name.asc()).all()


def get_packaging(db: Session, packaging_id: int) -> PackagingMaterial:
    item = db.query(PackagingMaterial).filter(PackagingMaterial.id == packaging_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Packaging material not found")
    return item


def create_packaging(db: Session, payload: PackagingCreate) -> PackagingMaterial:
    existing = db.query(PackagingMaterial).filter(PackagingMaterial.code == payload.code).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Packaging code already exists")
    item = PackagingMaterial(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def update_packaging(db: Session, packaging_id: int, payload: PackagingUpdate) -> PackagingMaterial:
    item = get_packaging(db, packaging_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item
