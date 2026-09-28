from datetime import datetime, timezone

from sqlalchemy import ForeignKey, DateTime, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


class Report(Base):
    """Generated analysis report: structured content (JSON, used to render
    the in-app report view) plus the LLM-authored natural-language
    explanation. A PDF is rendered on-demand from this content."""
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(primary_key=True)
    analysis_id: Mapped[int] = mapped_column(ForeignKey("analyses.id"), nullable=False, unique=True)

    ai_explanation: Mapped[str] = mapped_column(Text, default="")
    ai_generated: Mapped[bool] = mapped_column(default=False)  # False => template fallback was used
    content = mapped_column(JSON, default=dict)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    analysis = relationship("Analysis", back_populates="report")
