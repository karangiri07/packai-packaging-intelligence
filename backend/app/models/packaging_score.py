from sqlalchemy import Float, Integer, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


class PackagingScore(Base):
    """
    The scoring engine's output for one packaging candidate against one
    analysis: the final weighted score plus the transparent sub-score
    breakdown (stored as JSON so the frontend can render the
    "why this packaging" explainability panel without recomputation).
    """
    __tablename__ = "packaging_scores"

    id: Mapped[int] = mapped_column(primary_key=True)
    analysis_id: Mapped[int] = mapped_column(ForeignKey("analyses.id"), nullable=False)
    packaging_material_id: Mapped[int] = mapped_column(ForeignKey("packaging_materials.id"), nullable=False)

    final_score: Mapped[float] = mapped_column(Float, nullable=False)   # 0-100
    rank: Mapped[int] = mapped_column(Integer, nullable=False)

    oxygen_protection_score: Mapped[float] = mapped_column(Float, nullable=False)
    moisture_protection_score: Mapped[float] = mapped_column(Float, nullable=False)
    mechanical_protection_score: Mapped[float] = mapped_column(Float, nullable=False)
    shelf_life_score: Mapped[float] = mapped_column(Float, nullable=False)
    cost_score: Mapped[float] = mapped_column(Float, nullable=False)
    sustainability_score: Mapped[float] = mapped_column(Float, nullable=False)
    compatibility_score: Mapped[float] = mapped_column(Float, nullable=False)

    max_oxygen_protection: Mapped[float] = mapped_column(Float, nullable=False)
    max_moisture_protection: Mapped[float] = mapped_column(Float, nullable=False)
    max_mechanical_protection: Mapped[float] = mapped_column(Float, nullable=False)
    max_shelf_life: Mapped[float] = mapped_column(Float, nullable=False)
    max_cost: Mapped[float] = mapped_column(Float, nullable=False)
    max_sustainability: Mapped[float] = mapped_column(Float, nullable=False)
    max_compatibility: Mapped[float] = mapped_column(Float, nullable=False)

    estimated_shelf_life_months: Mapped[float] = mapped_column(Float, nullable=False)
    explanation_trace = mapped_column(JSON, default=list)  # list of {requirement, packaging_requirement, match, contribution}

    analysis = relationship("Analysis", back_populates="scores")
    packaging_material = relationship("PackagingMaterial")
