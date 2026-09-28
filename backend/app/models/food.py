from sqlalchemy import String, Float, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.database.session import Base


class FoodProduct(Base):
    """
    A food commodity with the physical/chemical/storage properties that
    drive packaging requirements. Seeded with 8 demo commodities; users may
    create custom ones from the Food Analysis screen.
    """
    __tablename__ = "food_products"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(255), nullable=False)

    moisture_pct: Mapped[float] = mapped_column(Float, nullable=False)
    fat_pct: Mapped[float] = mapped_column(Float, nullable=False)
    ph: Mapped[float] = mapped_column(Float, nullable=False)

    # low / medium / high
    oxygen_sensitivity: Mapped[str] = mapped_column(String(20), nullable=False)
    light_sensitivity: Mapped[str] = mapped_column(String(20), nullable=False)
    moisture_sensitivity: Mapped[str] = mapped_column(String(20), nullable=False)
    fragility: Mapped[str] = mapped_column(String(20), default="low")

    typical_shelf_life_months: Mapped[int] = mapped_column(Integer, nullable=False)
    storage_temperature_c: Mapped[float] = mapped_column(Float, nullable=False)
    humidity_sensitivity: Mapped[str] = mapped_column(String(20), nullable=False)

    # ambient / refrigerated / frozen
    transportation_condition: Mapped[str] = mapped_column(String(20), default="ambient")

    is_custom: Mapped[bool] = mapped_column(default=False)
