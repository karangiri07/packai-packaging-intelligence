"""
Requirements Mapper
====================
Converts raw food + environmental + business inputs into a structured set of
PACKAGING REQUIREMENTS on a common 0-10 "importance/required-strength" scale.

This is intentionally a rule-based, explainable transformation (not an LLM
call) so that every number the scoring engine later uses can be traced back
to a specific, inspectable rule. This is the "food data -> packaging
requirements" step in the architecture diagram.
"""
from dataclasses import dataclass, field
from typing import Dict, List


SENSITIVITY_TO_SCORE = {"low": 3, "medium": 6, "high": 9}


@dataclass
class PackagingRequirements:
    # Required strength targets, 0-10 (10 = maximum protection needed)
    required_oxygen_barrier: float
    required_moisture_barrier: float
    required_light_barrier: float
    required_mechanical_strength: float
    required_oil_resistance: float
    required_temperature_range: tuple  # (min_c, max_c) the packaging must tolerate
    required_map_compatible: bool

    # Relative importance weights (0-1, all reasons summed produce the trace)
    shelf_life_target_months: int
    crush_sensitive: bool = False  # highly fragile food: vacuum packing unsuitable

    # Human-readable trace of "why" each requirement was derived, used to
    # build the explainability panel later.
    rules_fired: List[Dict] = field(default_factory=list)


def _sensitivity_score(level: str) -> float:
    return SENSITIVITY_TO_SCORE.get((level or "medium").lower(), 6)


def map_food_to_requirements(
    *,
    moisture_pct: float,
    fat_pct: float,
    ph: float,
    oxygen_sensitivity: str,
    light_sensitivity: str,
    fragility: str = "medium",
    target_shelf_life_months: int,
    storage_temperature_c: float,
    relative_humidity_pct: float,
    transportation_condition: str = "ambient",
) -> PackagingRequirements:
    rules: List[Dict] = []

    # --- Oxygen barrier requirement ---
    oxygen_req = _sensitivity_score(oxygen_sensitivity)
    rules.append({
        "food_requirement": f"Oxygen sensitivity: {oxygen_sensitivity}",
        "packaging_requirement": f"Requires oxygen barrier strength >= {oxygen_req}/10",
    })
    # Longer shelf life amplifies oxygen barrier need
    if target_shelf_life_months >= 9:
        oxygen_req = min(10, oxygen_req + 1.5)
        rules.append({
            "food_requirement": f"Target shelf life {target_shelf_life_months} months (long)",
            "packaging_requirement": "Oxygen barrier requirement increased for long shelf life",
        })

    # --- Moisture barrier requirement ---
    moisture_req = _sensitivity_score("high" if moisture_pct <= 5 else ("medium" if moisture_pct <= 20 else "low"))
    rules.append({
        "food_requirement": f"Moisture content: {moisture_pct}%",
        "packaging_requirement": f"Requires moisture barrier strength >= {moisture_req}/10 (low-moisture foods need strong moisture protection to prevent staling/uptake)",
    })
    if relative_humidity_pct >= 70:
        moisture_req = min(10, moisture_req + 1.5)
        rules.append({
            "food_requirement": f"High relative humidity storage: {relative_humidity_pct}%",
            "packaging_requirement": "Moisture barrier requirement increased for humid storage/transport conditions",
        })

    # --- Light barrier requirement ---
    light_req = _sensitivity_score(light_sensitivity)
    rules.append({
        "food_requirement": f"Light sensitivity: {light_sensitivity}",
        "packaging_requirement": f"Requires light barrier strength >= {light_req}/10",
    })

    # --- Oil resistance requirement ---
    if fat_pct >= 20:
        oil_req = 8.0
        rules.append({
            "food_requirement": f"High fat/oil content: {fat_pct}%",
            "packaging_requirement": "Requires strong oil/grease resistance to prevent leakage and delamination",
        })
    elif fat_pct >= 8:
        oil_req = 5.5
        rules.append({
            "food_requirement": f"Moderate fat content: {fat_pct}%",
            "packaging_requirement": "Requires moderate oil resistance",
        })
    else:
        oil_req = 2.0

    # --- Mechanical strength requirement ---
    mech_req = _sensitivity_score(fragility)
    if transportation_condition == "frozen":
        mech_req = min(10, mech_req + 1)
        rules.append({
            "food_requirement": "Frozen transport/storage",
            "packaging_requirement": "Mechanical strength requirement increased (freeze-thaw handling stress)",
        })
    rules.append({
        "food_requirement": f"Fragility: {fragility}",
        "packaging_requirement": f"Requires mechanical strength >= {mech_req}/10",
    })

    # --- Temperature range requirement ---
    if transportation_condition == "frozen":
        temp_range = (-25, 40)
    elif transportation_condition == "refrigerated":
        temp_range = (0, 40)
    else:
        temp_range = (storage_temperature_c - 5, max(storage_temperature_c + 15, 60))
    rules.append({
        "food_requirement": f"Transportation condition: {transportation_condition}, storage {storage_temperature_c} C",
        "packaging_requirement": f"Packaging must tolerate approx {round(temp_range[0])}C to {round(temp_range[1])}C",
    })

    # --- MAP (modified atmosphere packaging) compatibility ---
    map_needed = oxygen_sensitivity.lower() == "high" and ph >= 4.6
    if map_needed:
        rules.append({
            "food_requirement": f"High oxygen sensitivity with pH {ph} (low-acid)",
            "packaging_requirement": "MAP (modified atmosphere packaging) compatibility recommended",
        })

    crush_sensitive = (fragility or "").lower() == "high"
    if crush_sensitive:
        rules.append({
            "food_requirement": "High fragility (crush-sensitive product)",
            "packaging_requirement": "Vacuum-based packaging is unsuitable; rigid or cushioned protection preferred",
        })

    return PackagingRequirements(
        required_oxygen_barrier=round(oxygen_req, 2),
        required_moisture_barrier=round(moisture_req, 2),
        required_light_barrier=round(light_req, 2),
        required_mechanical_strength=round(mech_req, 2),
        required_oil_resistance=round(oil_req, 2),
        required_temperature_range=temp_range,
        required_map_compatible=map_needed,
        crush_sensitive=crush_sensitive,
        shelf_life_target_months=target_shelf_life_months,
        rules_fired=rules,
    )
