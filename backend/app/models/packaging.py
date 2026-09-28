from sqlalchemy import String, Float, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.session import Base


class PackagingMaterial(Base):
    """
    A candidate packaging material/structure with the properties the
    scoring engine evaluates against a food's derived requirements.

    All numeric barrier/strength/sustainability scores are on a 0-10
    relative demo scale unless a physical unit is given (OTR, WVTR,
    thickness, temperature). These are illustrative approximations for a
    hackathon prototype, not laboratory-certified specifications.
    """
    __tablename__ = "packaging_materials"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(255), nullable=False)

    thickness_micron_min: Mapped[float] = mapped_column(Float, nullable=False)
    thickness_micron_max: Mapped[float] = mapped_column(Float, nullable=False)

    otr_cc_m2_day: Mapped[float] = mapped_column(Float, nullable=False)   # oxygen transmission rate (lower = better)
    wvtr_g_m2_day: Mapped[float] = mapped_column(Float, nullable=False)   # water vapor transmission rate (lower = better)

    sealability: Mapped[float] = mapped_column(Float, nullable=False)             # 0-10
    mechanical_strength: Mapped[float] = mapped_column(Float, nullable=False)      # 0-10
    light_barrier: Mapped[float] = mapped_column(Float, nullable=False)            # 0-10
    moisture_barrier: Mapped[float] = mapped_column(Float, nullable=False)         # 0-10
    oxygen_barrier: Mapped[float] = mapped_column(Float, nullable=False)           # 0-10
    oil_resistance: Mapped[float] = mapped_column(Float, nullable=False)           # 0-10

    temperature_resistance_c_min: Mapped[float] = mapped_column(Float, nullable=False)
    temperature_resistance_c_max: Mapped[float] = mapped_column(Float, nullable=False)

    map_compatible: Mapped[bool] = mapped_column(Boolean, default=False)
    vacuum_based: Mapped[bool] = mapped_column(Boolean, default=False)  # vacuum packing can crush fragile foods

    cost_index: Mapped[float] = mapped_column(Float, nullable=False)           # 0-10, higher = costlier
    sustainability_score: Mapped[float] = mapped_column(Float, nullable=False) # 0-10
    recyclability_score: Mapped[float] = mapped_column(Float, nullable=False)  # 0-10

    notes: Mapped[str] = mapped_column(Text, default="")
