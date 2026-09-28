from typing import Optional

from pydantic import BaseModel, Field


class PackagingBase(BaseModel):
    code: str = Field(min_length=1, max_length=50)
    name: str = Field(min_length=1, max_length=255)
    category: str
    thickness_micron_min: float = Field(gt=0)
    thickness_micron_max: float = Field(gt=0)
    otr_cc_m2_day: float = Field(ge=0)
    wvtr_g_m2_day: float = Field(ge=0)
    sealability: float = Field(ge=0, le=10)
    mechanical_strength: float = Field(ge=0, le=10)
    light_barrier: float = Field(ge=0, le=10)
    moisture_barrier: float = Field(ge=0, le=10)
    oxygen_barrier: float = Field(ge=0, le=10)
    oil_resistance: float = Field(ge=0, le=10)
    temperature_resistance_c_min: float
    temperature_resistance_c_max: float
    map_compatible: bool = False
    vacuum_based: bool = False
    cost_index: float = Field(ge=0, le=10)
    sustainability_score: float = Field(ge=0, le=10)
    recyclability_score: float = Field(ge=0, le=10)
    notes: str = ""


class PackagingCreate(PackagingBase):
    pass


class PackagingUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    cost_index: Optional[float] = Field(default=None, ge=0, le=10)
    sustainability_score: Optional[float] = Field(default=None, ge=0, le=10)
    recyclability_score: Optional[float] = Field(default=None, ge=0, le=10)
    notes: Optional[str] = None


class PackagingOut(PackagingBase):
    id: int

    class Config:
        from_attributes = True
