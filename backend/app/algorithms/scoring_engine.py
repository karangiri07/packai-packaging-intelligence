"""
Multi-Factor Packaging Decision Engine
=======================================
This is the transparent, non-LLM scoring engine referenced throughout the
system architecture. It:

  1. Takes the derived PackagingRequirements (from requirements_mapper.py)
  2. Compares them against each packaging candidate's physical properties
  3. Produces seven 0-1 "fit" sub-scores (oxygen, moisture, mechanical,
     shelf life, cost, sustainability, compatibility)
  4. Applies the priority-dependent weight profile (weights.py) to combine
     them into a single 0-100 final score
  5. Returns a full explanation trace: food requirement -> packaging
     requirement -> matching property -> contribution to score

No LLM is involved in this module. The LLM only narrates the result
afterwards (see app/ai/explanation_service.py).
"""
from dataclasses import dataclass, field
from typing import Dict, List

from app.algorithms.requirements_mapper import PackagingRequirements
from app.algorithms.weights import get_weights


@dataclass
class CandidateScoreResult:
    packaging_id: int
    packaging_code: str
    packaging_name: str
    final_score: float  # 0-100

    oxygen_protection_score: float  # 0-1 normalized fit
    moisture_protection_score: float
    mechanical_protection_score: float
    shelf_life_score: float
    cost_score: float
    sustainability_score: float
    compatibility_score: float

    max_points: Dict[str, float]  # per-dimension max achievable points at current weights
    estimated_shelf_life_months: float
    explanation_trace: List[Dict] = field(default_factory=list)


def _clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))


def _fit_ratio(available: float, required: float,
               overspec_tolerance: float = 2.0, overspec_penalty: float = 0.05) -> float:
    """How well an available 0-10 property covers a 0-10 requirement.

    - Shortfall: penalized proportionally (available / required).
    - Right-sized (up to `overspec_tolerance` points above the need): full marks.
    - Over-specified: a small penalty per extra point (floor 0.7), because
      paying for barrier/strength the food does not need is wasteful - this is
      the "right-sizing" behaviour that stops premium materials (foil, glass)
      from winning every analysis just by being the strongest."""
    if required <= 0:
        return 1.0
    if available < required:
        return _clamp01(available / required)
    excess = available - required
    if excess <= overspec_tolerance:
        return 1.0
    return max(0.7, 1.0 - (excess - overspec_tolerance) * overspec_penalty)


def _estimate_shelf_life(packaging, requirements: PackagingRequirements) -> float:
    """Rough, explainable shelf-life estimate: start from the food's target,
    then adjust based on how much barrier headroom/deficit the candidate has.
    This is a demo heuristic, not a validated shelf-life prediction model."""
    base = requirements.shelf_life_target_months
    oxygen_delta = packaging.oxygen_barrier - requirements.required_oxygen_barrier
    moisture_delta = packaging.moisture_barrier - requirements.required_moisture_barrier
    avg_delta = (oxygen_delta + moisture_delta) / 2
    factor = 1 + (avg_delta / 10) * 0.6  # +/-60% swing at extreme deltas
    estimate = base * max(0.4, factor)
    return round(estimate, 1)


def score_candidate(packaging, requirements: PackagingRequirements, priority: str) -> CandidateScoreResult:
    weights = get_weights(priority)
    trace: List[Dict] = list()

    # 1) Oxygen protection fit
    oxygen_fit = _fit_ratio(packaging.oxygen_barrier, requirements.required_oxygen_barrier)
    trace.append({
        "dimension": "Oxygen Protection",
        "food_requirement": f"Required oxygen barrier: {requirements.required_oxygen_barrier}/10",
        "packaging_property": f"{packaging.name} oxygen barrier: {packaging.oxygen_barrier}/10 (OTR ~{packaging.otr_cc_m2_day} cc/m2/day)",
        "match": "Meets/exceeds requirement" if oxygen_fit >= 0.95 else ("Partially meets requirement" if oxygen_fit >= 0.6 else "Falls short of requirement"),
        "contribution_pct": round(oxygen_fit * weights["oxygen_protection"], 1),
        "max_pct": weights["oxygen_protection"],
    })

    # 2) Moisture protection fit
    moisture_fit = _fit_ratio(packaging.moisture_barrier, requirements.required_moisture_barrier)
    trace.append({
        "dimension": "Moisture Protection",
        "food_requirement": f"Required moisture barrier: {requirements.required_moisture_barrier}/10",
        "packaging_property": f"{packaging.name} moisture barrier: {packaging.moisture_barrier}/10 (WVTR ~{packaging.wvtr_g_m2_day} g/m2/day)",
        "match": "Meets/exceeds requirement" if moisture_fit >= 0.95 else ("Partially meets requirement" if moisture_fit >= 0.6 else "Falls short of requirement"),
        "contribution_pct": round(moisture_fit * weights["moisture_protection"], 1),
        "max_pct": weights["moisture_protection"],
    })

    # 3) Mechanical protection fit (also folds in oil resistance as a
    #    secondary structural/compatibility factor)
    mech_fit = _fit_ratio(packaging.mechanical_strength, requirements.required_mechanical_strength)
    oil_fit = _fit_ratio(packaging.oil_resistance, requirements.required_oil_resistance)
    mech_combined = _clamp01(0.7 * mech_fit + 0.3 * oil_fit)
    trace.append({
        "dimension": "Mechanical Protection",
        "food_requirement": f"Required mechanical strength: {requirements.required_mechanical_strength}/10, oil resistance: {requirements.required_oil_resistance}/10",
        "packaging_property": f"{packaging.name} mechanical strength: {packaging.mechanical_strength}/10, oil resistance: {packaging.oil_resistance}/10",
        "match": "Meets/exceeds requirement" if mech_combined >= 0.95 else ("Partially meets requirement" if mech_combined >= 0.6 else "Falls short of requirement"),
        "contribution_pct": round(mech_combined * weights["mechanical_protection"], 1),
        "max_pct": weights["mechanical_protection"],
    })

    # 4) Shelf life fit - combines light barrier fit with an overall
    #    barrier-headroom check versus the target shelf life
    light_fit = _fit_ratio(packaging.light_barrier, requirements.required_light_barrier)
    shelf_est = _estimate_shelf_life(packaging, requirements)
    shelf_ratio = _clamp01(shelf_est / max(1, requirements.shelf_life_target_months))
    shelf_life_fit = _clamp01(0.5 * light_fit + 0.5 * shelf_ratio)
    trace.append({
        "dimension": "Shelf Life",
        "food_requirement": f"Target shelf life: {requirements.shelf_life_target_months} months, required light barrier: {requirements.required_light_barrier}/10",
        "packaging_property": f"Estimated achievable shelf life: ~{shelf_est} months; light barrier: {packaging.light_barrier}/10",
        "match": "Meets/exceeds target shelf life" if shelf_ratio >= 0.95 else ("Close to target shelf life" if shelf_ratio >= 0.75 else "Below target shelf life"),
        "contribution_pct": round(shelf_life_fit * weights["shelf_life"], 1),
        "max_pct": weights["shelf_life"],
    })

    # 5) Cost fit - lower cost_index is better; scored as inverse fit
    cost_fit = _clamp01(1 - (packaging.cost_index / 10))
    trace.append({
        "dimension": "Cost",
        "food_requirement": "Lower packaging cost is preferred (weight depends on selected priority)",
        "packaging_property": f"{packaging.name} relative cost index: {packaging.cost_index}/10",
        "match": "Low cost" if packaging.cost_index <= 4 else ("Moderate cost" if packaging.cost_index <= 7 else "High cost"),
        "contribution_pct": round(cost_fit * weights["cost"], 1),
        "max_pct": weights["cost"],
    })

    # 6) Sustainability fit - average of sustainability + recyclability
    sustain_fit = _clamp01(((packaging.sustainability_score + packaging.recyclability_score) / 2) / 10)
    trace.append({
        "dimension": "Sustainability",
        "food_requirement": "Higher sustainability/recyclability is preferred (weight depends on selected priority)",
        "packaging_property": f"{packaging.name} sustainability: {packaging.sustainability_score}/10, recyclability: {packaging.recyclability_score}/10",
        "match": "Strong sustainability profile" if sustain_fit >= 0.7 else ("Moderate sustainability profile" if sustain_fit >= 0.4 else "Weak sustainability profile"),
        "contribution_pct": round(sustain_fit * weights["sustainability"], 1),
        "max_pct": weights["sustainability"],
    })

    # 7) Compatibility fit - temperature range + MAP compatibility
    temp_min_req, temp_max_req = requirements.required_temperature_range
    temp_ok = (packaging.temperature_resistance_c_min <= temp_min_req + 1) and (packaging.temperature_resistance_c_max >= temp_max_req - 1)
    map_ok = (not requirements.required_map_compatible) or packaging.map_compatible
    compatibility_fit = _clamp01((0.6 if temp_ok else 0.2) + (0.4 if map_ok else 0.0))
    crush_conflict = requirements.crush_sensitive and getattr(packaging, "vacuum_based", False)
    if crush_conflict:
        compatibility_fit = _clamp01(compatibility_fit - 0.6)
    trace.append({
        "dimension": "Compatibility",
        "food_requirement": f"Must tolerate ~{round(temp_min_req)}C to {round(temp_max_req)}C"
                              + (", MAP compatibility recommended" if requirements.required_map_compatible else ""),
        "packaging_property": f"{packaging.name} tolerates {packaging.temperature_resistance_c_min}C to {packaging.temperature_resistance_c_max}C, MAP compatible: {packaging.map_compatible}",
        "match": ("Unsuitable: vacuum packing can crush fragile food" if crush_conflict
                  else "Fully compatible" if compatibility_fit >= 0.95
                  else "Mostly compatible" if compatibility_fit >= 0.6
                  else "Compatibility concerns"),
        "contribution_pct": round(compatibility_fit * weights["compatibility"], 1),
        "max_pct": weights["compatibility"],
    })

    final_score = sum(t["contribution_pct"] for t in trace)

    return CandidateScoreResult(
        packaging_id=packaging.id,
        packaging_code=packaging.code,
        packaging_name=packaging.name,
        final_score=round(final_score, 1),
        oxygen_protection_score=round(oxygen_fit, 3),
        moisture_protection_score=round(moisture_fit, 3),
        mechanical_protection_score=round(mech_combined, 3),
        shelf_life_score=round(shelf_life_fit, 3),
        cost_score=round(cost_fit, 3),
        sustainability_score=round(sustain_fit, 3),
        compatibility_score=round(compatibility_fit, 3),
        max_points=weights,
        estimated_shelf_life_months=shelf_est,
        explanation_trace=trace,
    )


def score_all_candidates(packaging_list, requirements: PackagingRequirements, priority: str) -> List[CandidateScoreResult]:
    results = [score_candidate(p, requirements, priority) for p in packaging_list]
    results.sort(key=lambda r: r.final_score, reverse=True)
    return results
