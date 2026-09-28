from datetime import datetime, timezone

from sqlalchemy import String, Float, Integer, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


class Analysis(Base):
    """
    One packaging analysis request: a snapshot of the food inputs (which may
    be edited away from the seeded defaults) plus the chosen optimization
    priority. Scoring results, the top recommendation and the report all
    hang off this record.
    """
    __tablename__ = "analyses"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    food_product_id: Mapped[int] = mapped_column(ForeignKey("food_products.id"), nullable=False)
    current_packaging_id: Mapped[int | None] = mapped_column(ForeignKey("packaging_materials.id"), nullable=True)

    # Snapshot of the (possibly user-edited) food inputs used for this run
    food_name: Mapped[str] = mapped_column(String(255), nullable=False)
    moisture_pct: Mapped[float] = mapped_column(Float, nullable=False)
    fat_pct: Mapped[float] = mapped_column(Float, nullable=False)
    ph: Mapped[float] = mapped_column(Float, nullable=False)
    target_shelf_life_months: Mapped[int] = mapped_column(Integer, nullable=False)
    storage_temperature_c: Mapped[float] = mapped_column(Float, nullable=False)
    relative_humidity_pct: Mapped[float] = mapped_column(Float, nullable=False)
    oxygen_sensitivity: Mapped[str] = mapped_column(String(20), nullable=False)
    light_sensitivity: Mapped[str] = mapped_column(String(20), nullable=False)
    transportation_condition: Mapped[str] = mapped_column(String(20), nullable=False)

    # balanced / cost / shelf_life / sustainability / protection
    priority: Mapped[str] = mapped_column(String(30), default="balanced")

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="analyses")
    food_product = relationship("FoodProduct")
    current_packaging = relationship("PackagingMaterial", foreign_keys=[current_packaging_id])
    scores = relationship("PackagingScore", back_populates="analysis", cascade="all, delete-orphan")
    recommendation = relationship("Recommendation", back_populates="analysis", uselist=False, cascade="all, delete-orphan")
    report = relationship("Report", back_populates="analysis", uselist=False, cascade="all, delete-orphan")
