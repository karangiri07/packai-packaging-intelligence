from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator

SensitivityLevel = Literal["low", "medium", "high"]
TransportCondition = Literal["ambient", "refrigerated", "frozen"]


class FoodBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    category: str = Field(min_length=1, max_length=255)
    moisture_pct: float = Field(ge=0, le=100)
    fat_pct: float = Field(ge=0, le=100)
    ph: float = Field(ge=0, le=14)
    oxygen_sensitivity: SensitivityLevel
    light_sensitivity: SensitivityLevel
    moisture_sensitivity: SensitivityLevel
    fragility: SensitivityLevel = "low"
    typical_shelf_life_months: int = Field(gt=0, le=60)
    storage_temperature_c: float = Field(ge=-30, le=60)
    humidity_sensitivity: SensitivityLevel
    transportation_condition: TransportCondition = "ambient"

    @field_validator("moisture_pct", "fat_pct")
    @classmethod
    def not_negative(cls, v):
        if v < 0:
            raise ValueError("must not be negative")
        return v


class FoodCreate(FoodBase):
    pass


class FoodUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    moisture_pct: Optional[float] = Field(default=None, ge=0, le=100)
    fat_pct: Optional[float] = Field(default=None, ge=0, le=100)
    ph: Optional[float] = Field(default=None, ge=0, le=14)
    oxygen_sensitivity: Optional[SensitivityLevel] = None
    light_sensitivity: Optional[SensitivityLevel] = None
    moisture_sensitivity: Optional[SensitivityLevel] = None
    fragility: Optional[SensitivityLevel] = None
    typical_shelf_life_months: Optional[int] = Field(default=None, gt=0, le=60)
    storage_temperature_c: Optional[float] = Field(default=None, ge=-30, le=60)
    humidity_sensitivity: Optional[SensitivityLevel] = None
    transportation_condition: Optional[TransportCondition] = None


class FoodOut(FoodBase):
    id: int
    is_custom: bool

    class Config:
        from_attributes = True
