from typing import List, Literal, Optional

from pydantic import BaseModel, Field

SensitivityLevel = Literal["low", "medium", "high"]
TransportCondition = Literal["ambient", "refrigerated", "frozen"]
Priority = Literal["balanced", "cost", "shelf_life", "sustainability", "protection"]


class AnalysisCreate(BaseModel):
    food_product_id: int
    current_packaging_id: Optional[int] = None
    # All optional overrides - if omitted, the selected food's defaults are used
    moisture_pct: Optional[float] = Field(default=None, ge=0, le=100)
    fat_pct: Optional[float] = Field(default=None, ge=0, le=100)
    ph: Optional[float] = Field(default=None, ge=0, le=14)
    target_shelf_life_months: Optional[int] = Field(default=None, gt=0, le=60)
    storage_temperature_c: Optional[float] = Field(default=None, ge=-30, le=60)
    relative_humidity_pct: Optional[float] = Field(default=None, ge=0, le=100)
    oxygen_sensitivity: Optional[SensitivityLevel] = None
    light_sensitivity: Optional[SensitivityLevel] = None
    transportation_condition: Optional[TransportCondition] = None
    priority: Priority = "balanced"


class AnalysisOut(BaseModel):
    id: int
    food_product_id: int
    current_packaging_id: Optional[int] = None
    food_name: str
    moisture_pct: float
    fat_pct: float
    ph: float
    target_shelf_life_months: int
    storage_temperature_c: float
    relative_humidity_pct: float
    oxygen_sensitivity: str
    light_sensitivity: str
    transportation_condition: str
    priority: str

    class Config:
        from_attributes = True


class ExplanationTraceItem(BaseModel):
    dimension: str
    food_requirement: str
    packaging_property: str
    match: str
    contribution_pct: float
    max_pct: float


class PackagingScoreOut(BaseModel):
    packaging_id: int
    packaging_code: str
    packaging_name: str
    packaging_category: str
    final_score: float
    rank: int
    cost_index: float
    sustainability_score: float
    recyclability_score: float
    estimated_shelf_life_months: float
    explanation_trace: List[ExplanationTraceItem]


class RecommendationOut(BaseModel):
    analysis_id: int
    packaging_id: int
    packaging_code: str
    packaging_name: str
    packaging_category: str
    overall_suitability_pct: float
    cost_level: str
    sustainability_level: str
    estimated_shelf_life_months: float
    recommended_specifications: dict
    explanation_trace: List[ExplanationTraceItem]
    rules_fired: List[dict]


class ComparisonOut(BaseModel):
    analysis_id: int
    candidates: List[PackagingScoreOut]


class ExplanationRequestOut(BaseModel):
    analysis_id: int
    ai_generated: bool
    explanation: str
