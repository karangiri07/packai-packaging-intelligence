import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from types import SimpleNamespace

from app.algorithms.requirements_mapper import map_food_to_requirements
from app.algorithms.scoring_engine import score_candidate
from app.algorithms.weights import get_weights


def _fake_packaging(**overrides):
    base = dict(
        id=1, code="TEST", name="Test Material",
        oxygen_barrier=8, moisture_barrier=8, light_barrier=8,
        mechanical_strength=8, oil_resistance=8,
        otr_cc_m2_day=5, wvtr_g_m2_day=2,
        temperature_resistance_c_min=-20, temperature_resistance_c_max=100,
        map_compatible=True, cost_index=5, sustainability_score=5, recyclability_score=5,
    )
    base.update(overrides)
    return SimpleNamespace(**base)


def test_high_oxygen_sensitivity_requires_high_barrier():
    req = map_food_to_requirements(
        moisture_pct=2, fat_pct=35, ph=6.2, oxygen_sensitivity="high", light_sensitivity="medium",
        fragility="medium", target_shelf_life_months=6, storage_temperature_c=25,
        relative_humidity_pct=65, transportation_condition="ambient",
    )
    assert req.required_oxygen_barrier >= 9


def test_low_moisture_food_requires_strong_moisture_barrier():
    req = map_food_to_requirements(
        moisture_pct=2, fat_pct=5, ph=6.5, oxygen_sensitivity="low", light_sensitivity="low",
        fragility="low", target_shelf_life_months=6, storage_temperature_c=25,
        relative_humidity_pct=50, transportation_condition="ambient",
    )
    assert req.required_moisture_barrier >= 8


def test_weights_sum_to_100_for_every_priority():
    for priority in ["balanced", "cost", "shelf_life", "sustainability", "protection"]:
        weights = get_weights(priority)
        assert sum(weights.values()) == 100


def test_stronger_barrier_scores_higher_than_weaker_barrier():
    req = map_food_to_requirements(
        moisture_pct=2, fat_pct=35, ph=6.2, oxygen_sensitivity="high", light_sensitivity="medium",
        fragility="medium", target_shelf_life_months=9, storage_temperature_c=25,
        relative_humidity_pct=65, transportation_condition="ambient",
    )
    strong = _fake_packaging(oxygen_barrier=10, moisture_barrier=10)
    weak = _fake_packaging(oxygen_barrier=2, moisture_barrier=2)

    strong_result = score_candidate(strong, req, "balanced")
    weak_result = score_candidate(weak, req, "balanced")

    assert strong_result.final_score > weak_result.final_score


def test_cost_priority_favors_cheaper_material_when_protection_is_similar():
    req = map_food_to_requirements(
        moisture_pct=10, fat_pct=5, ph=6.5, oxygen_sensitivity="medium", light_sensitivity="low",
        fragility="low", target_shelf_life_months=6, storage_temperature_c=25,
        relative_humidity_pct=55, transportation_condition="ambient",
    )
    cheap = _fake_packaging(cost_index=2, oxygen_barrier=6, moisture_barrier=6)
    expensive = _fake_packaging(cost_index=9, oxygen_barrier=6, moisture_barrier=6)

    cheap_result = score_candidate(cheap, req, "cost")
    expensive_result = score_candidate(expensive, req, "cost")

    assert cheap_result.final_score > expensive_result.final_score


def test_every_candidate_produces_seven_dimension_trace():
    req = map_food_to_requirements(
        moisture_pct=10, fat_pct=5, ph=6.5, oxygen_sensitivity="medium", light_sensitivity="low",
        fragility="low", target_shelf_life_months=6, storage_temperature_c=25,
        relative_humidity_pct=55, transportation_condition="ambient",
    )
    result = score_candidate(_fake_packaging(), req, "balanced")
    assert len(result.explanation_trace) == 7
    assert 0 <= result.final_score <= 100


# ---------- regression tests for realism fixes ----------
from app.algorithms.scoring_engine import _fit_ratio
from app.algorithms.optimizer import optimize


def test_overspecification_is_penalized_versus_right_sized():
    # Requirement 3/10: a 10/10 material is heavily over-specified, a 5/10 is right-sized
    assert _fit_ratio(5, 3) == 1.0
    assert _fit_ratio(10, 3) < _fit_ratio(5, 3)
    assert _fit_ratio(10, 3) >= 0.7  # penalty is bounded, never punishes into a fail


def test_shortfall_scores_below_one():
    assert _fit_ratio(2, 8) == 0.25


def test_vacuum_packaging_penalized_for_crush_sensitive_food():
    req = map_food_to_requirements(
        moisture_pct=4, fat_pct=18, ph=6.5, oxygen_sensitivity="medium", light_sensitivity="low",
        fragility="high", target_shelf_life_months=9, storage_temperature_c=25,
        relative_humidity_pct=60, transportation_condition="ambient",
    )
    assert req.crush_sensitive is True
    normal = score_candidate(_fake_packaging(vacuum_based=False), req, "balanced")
    vacuum = score_candidate(_fake_packaging(vacuum_based=True), req, "balanced")
    assert vacuum.compatibility_score < normal.compatibility_score
    assert vacuum.final_score < normal.final_score


def test_cost_priority_protection_floor_excludes_dangerously_weak_options():
    req = map_food_to_requirements(
        moisture_pct=2, fat_pct=35, ph=6.2, oxygen_sensitivity="high", light_sensitivity="medium",
        fragility="medium", target_shelf_life_months=6, storage_temperature_c=25,
        relative_humidity_pct=65, transportation_condition="ambient",
    )
    strong = _fake_packaging(id=1, code="STRONG", name="Strong", cost_index=6, oxygen_barrier=9, moisture_barrier=9)
    dirt_cheap_but_weak = _fake_packaging(id=2, code="WEAK", name="Weak", cost_index=1, oxygen_barrier=1, moisture_barrier=1)
    results = [score_candidate(dirt_cheap_but_weak, req, "cost"), score_candidate(strong, req, "cost")]
    optimized = optimize(sorted(results, key=lambda r: r.final_score, reverse=True), "cost")
    assert [r.packaging_code for r in optimized] == ["STRONG"]
