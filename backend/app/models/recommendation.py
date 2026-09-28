from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


class Recommendation(Base):
    """The single top-ranked packaging choice for an analysis, denormalized
    for fast reads on the recommendation/dashboard screens."""
    __tablename__ = "recommendations"

    id: Mapped[int] = mapped_column(primary_key=True)
    analysis_id: Mapped[int] = mapped_column(ForeignKey("analyses.id"), nullable=False, unique=True)
    packaging_material_id: Mapped[int] = mapped_column(ForeignKey("packaging_materials.id"), nullable=False)
    packaging_score_id: Mapped[int] = mapped_column(ForeignKey("packaging_scores.id"), nullable=False)

    overall_suitability_pct: Mapped[float] = mapped_column(Float, nullable=False)
    cost_level: Mapped[str] = mapped_column(String(20), nullable=False)
    sustainability_level: Mapped[str] = mapped_column(String(20), nullable=False)
    estimated_shelf_life_months: Mapped[float] = mapped_column(Float, nullable=False)

    analysis = relationship("Analysis", back_populates="recommendation")
    packaging_material = relationship("PackagingMaterial")
