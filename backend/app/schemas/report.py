from typing import List

from pydantic import BaseModel


class ReportOut(BaseModel):
    analysis_id: int
    food_information: dict
    current_packaging: dict | None = None
    packaging_recommendation: dict
    packaging_specifications: dict
    overall_score: float
    before_after: dict | None = None
    alternative_options: List[dict]
    cost_analysis: dict
    shelf_life_analysis: dict
    sustainability_analysis: dict
    decision_explanation: str
    important_assumptions: List[str]
    disclaimer: str
    ai_generated: bool
