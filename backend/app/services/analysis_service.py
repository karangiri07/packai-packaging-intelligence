from typing import List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.algorithms.optimizer import optimize
from app.algorithms.requirements_mapper import map_food_to_requirements
from app.algorithms.scoring_engine import CandidateScoreResult, score_all_candidates
from app.models.analysis import Analysis
from app.models.food import FoodProduct
from app.models.packaging import PackagingMaterial
from app.models.packaging_score import PackagingScore
from app.models.recommendation import Recommendation
from app.schemas.analysis import AnalysisCreate
from app.utils.validators import validate_analysis_inputs


def _cost_level(cost_index: float) -> str:
    if cost_index <= 4:
        return "Low"
    if cost_index <= 7:
        return "Medium"
    return "High"


def _sustainability_level(sustainability_score: float, recyclability_score: float) -> str:
    avg = (sustainability_score + recyclability_score) / 2
    if avg >= 7:
        return "High"
    if avg >= 4.5:
        return "Medium"
    return "Low"


def create_analysis(db: Session, user_id: int, payload: AnalysisCreate) -> Analysis:
    food = db.query(FoodProduct).filter(FoodProduct.id == payload.food_product_id).first()
    if not food:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Food product not found")

    current_packaging = None
    if payload.current_packaging_id is not None:
        current_packaging = db.query(PackagingMaterial).filter(PackagingMaterial.id == payload.current_packaging_id).first()
        if not current_packaging:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Current packaging not found")

    # Merge user overrides on top of the food's seeded defaults
    moisture_pct = payload.moisture_pct if payload.moisture_pct is not None else food.moisture_pct
    fat_pct = payload.fat_pct if payload.fat_pct is not None else food.fat_pct
    ph = payload.ph if payload.ph is not None else food.ph
    target_shelf_life_months = payload.target_shelf_life_months or food.typical_shelf_life_months
    storage_temperature_c = payload.storage_temperature_c if payload.storage_temperature_c is not None else food.storage_temperature_c
    relative_humidity_pct = payload.relative_humidity_pct if payload.relative_humidity_pct is not None else 60.0
    oxygen_sensitivity = payload.oxygen_sensitivity or food.oxygen_sensitivity
    light_sensitivity = payload.light_sensitivity or food.light_sensitivity
    transportation_condition = payload.transportation_condition or food.transportation_condition

    validate_analysis_inputs(
        ph=ph, moisture_pct=moisture_pct, fat_pct=fat_pct,
        target_shelf_life_months=target_shelf_life_months,
        storage_temperature_c=storage_temperature_c,
        relative_humidity_pct=relative_humidity_pct,
    )

    analysis = Analysis(
        user_id=user_id,
        food_product_id=food.id,
        current_packaging_id=current_packaging.id if current_packaging else None,
        food_name=food.name,
        moisture_pct=moisture_pct,
        fat_pct=fat_pct,
        ph=ph,
        target_shelf_life_months=target_shelf_life_months,
        storage_temperature_c=storage_temperature_c,
        relative_humidity_pct=relative_humidity_pct,
        oxygen_sensitivity=oxygen_sensitivity,
        light_sensitivity=light_sensitivity,
        transportation_condition=transportation_condition,
        priority=payload.priority,
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    _run_scoring_pipeline(db, analysis, food.fragility)
    return analysis


def _run_scoring_pipeline(db: Session, analysis: Analysis, fragility: str) -> List[CandidateScoreResult]:
    requirements = map_food_to_requirements(
        moisture_pct=analysis.moisture_pct,
        fat_pct=analysis.fat_pct,
        ph=analysis.ph,
        oxygen_sensitivity=analysis.oxygen_sensitivity,
        light_sensitivity=analysis.light_sensitivity,
        fragility=fragility,
        target_shelf_life_months=analysis.target_shelf_life_months,
        storage_temperature_c=analysis.storage_temperature_c,
        relative_humidity_pct=analysis.relative_humidity_pct,
        transportation_condition=analysis.transportation_condition,
    )

    packaging_list = db.query(PackagingMaterial).all()
    if not packaging_list:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="No packaging materials in database")

    scored = score_all_candidates(packaging_list, requirements, analysis.priority)
    optimized = optimize(scored, analysis.priority)

    packaging_by_id = {p.id: p for p in packaging_list}

    for rank, result in enumerate(optimized, start=1):
        score_row = PackagingScore(
            analysis_id=analysis.id,
            packaging_material_id=result.packaging_id,
            final_score=result.final_score,
            rank=rank,
            oxygen_protection_score=result.oxygen_protection_score,
            moisture_protection_score=result.moisture_protection_score,
            mechanical_protection_score=result.mechanical_protection_score,
            shelf_life_score=result.shelf_life_score,
            cost_score=result.cost_score,
            sustainability_score=result.sustainability_score,
            compatibility_score=result.compatibility_score,
            max_oxygen_protection=result.max_points["oxygen_protection"],
            max_moisture_protection=result.max_points["moisture_protection"],
            max_mechanical_protection=result.max_points["mechanical_protection"],
            max_shelf_life=result.max_points["shelf_life"],
            max_cost=result.max_points["cost"],
            max_sustainability=result.max_points["sustainability"],
            max_compatibility=result.max_points["compatibility"],
            estimated_shelf_life_months=result.estimated_shelf_life_months,
            explanation_trace=result.explanation_trace,
        )
        db.add(score_row)
    db.commit()

    top_score_row = (
        db.query(PackagingScore)
        .filter(PackagingScore.analysis_id == analysis.id)
        .order_by(PackagingScore.rank.asc())
        .first()
    )
    top_packaging = packaging_by_id[top_score_row.packaging_material_id]

    recommendation = Recommendation(
        analysis_id=analysis.id,
        packaging_material_id=top_packaging.id,
        packaging_score_id=top_score_row.id,
        overall_suitability_pct=top_score_row.final_score,
        cost_level=_cost_level(top_packaging.cost_index),
        sustainability_level=_sustainability_level(top_packaging.sustainability_score, top_packaging.recyclability_score),
        estimated_shelf_life_months=top_score_row.estimated_shelf_life_months,
    )
    db.add(recommendation)
    db.commit()

    # stash requirements trace on the analysis object (in-memory) for the
    # recommendation endpoint to reuse without recomputation this request
    analysis._requirements_rules = requirements.rules_fired  # type: ignore[attr-defined]
    return optimized
