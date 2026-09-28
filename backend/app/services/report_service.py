from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.ai.explanation_service import generate_explanation
from app.models.analysis import Analysis
from app.models.packaging import PackagingMaterial
from app.models.packaging_score import PackagingScore
from app.models.recommendation import Recommendation
from app.models.report import Report

DISCLAIMER = (
    "This application is a decision-support prototype, not a replacement for "
    "laboratory testing, food safety validation, regulatory certification, or "
    "professional packaging engineering. All material property values are "
    "approximate demo figures for educational/hackathon purposes."
)

ASSUMPTIONS = [
    "Packaging material properties are approximate relative values for demonstration, not certified lab measurements.",
    "Shelf-life estimates are derived from a heuristic barrier-headroom model, not accelerated shelf-life testing.",
    "Relative humidity defaults to 60% when not specified by the user.",
    "Cost and sustainability figures are relative indices (0-10), not real market prices or LCA scores.",
]


def _get_analysis_or_404(db: Session, analysis_id: int, user_id: int) -> Analysis:
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id, Analysis.user_id == user_id).first()
    if not analysis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")
    return analysis


def _score_rows_with_packaging(db: Session, analysis_id: int):
    return (
        db.query(PackagingScore, PackagingMaterial)
        .join(PackagingMaterial, PackagingScore.packaging_material_id == PackagingMaterial.id)
        .filter(PackagingScore.analysis_id == analysis_id)
        .order_by(PackagingScore.rank.asc())
        .all()
    )


def build_report(db: Session, analysis_id: int, user_id: int, force_regenerate: bool = False) -> Report:
    analysis = _get_analysis_or_404(db, analysis_id, user_id)
    recommendation = db.query(Recommendation).filter(Recommendation.analysis_id == analysis_id).first()
    if not recommendation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recommendation not found for this analysis")

    existing = db.query(Report).filter(Report.analysis_id == analysis_id).first()
    if existing and not force_regenerate:
        return existing

    rows = _score_rows_with_packaging(db, analysis_id)
    if not rows:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No scores found for this analysis")

    top_score, top_packaging = rows[0]
    alt_rows = rows[1:5]
    current_packaging = analysis.current_packaging

    top_dict = {
        "packaging_name": top_packaging.name,
        "final_score": top_score.final_score,
        "estimated_shelf_life_months": top_score.estimated_shelf_life_months,
        "cost_level": recommendation.cost_level,
        "sustainability_level": recommendation.sustainability_level,
        "trace": top_score.explanation_trace,
    }
    alternatives = [{"packaging_name": pkg.name, "final_score": score.final_score} for score, pkg in alt_rows]

    explanation_text, ai_generated = generate_explanation(
        food_name=analysis.food_name,
        priority=analysis.priority,
        top=top_dict,
        alternatives=alternatives,
    )

    content = {
        "food_information": {
            "name": analysis.food_name,
            "moisture_pct": analysis.moisture_pct,
            "fat_pct": analysis.fat_pct,
            "ph": analysis.ph,
            "target_shelf_life_months": analysis.target_shelf_life_months,
            "storage_temperature_c": analysis.storage_temperature_c,
            "relative_humidity_pct": analysis.relative_humidity_pct,
            "oxygen_sensitivity": analysis.oxygen_sensitivity,
            "light_sensitivity": analysis.light_sensitivity,
            "transportation_condition": analysis.transportation_condition,
            "priority": analysis.priority,
        },
        "current_packaging": ({
            "id": current_packaging.id,
            "material": current_packaging.name,
            "category": current_packaging.category,
            "cost_index": current_packaging.cost_index,
            "sustainability_score": current_packaging.sustainability_score,
            "recyclability_score": current_packaging.recyclability_score,
        } if current_packaging else None),
        "packaging_recommendation": {
            "material": top_packaging.name,
            "category": top_packaging.category,
            "overall_suitability_pct": top_score.final_score,
        },
        "packaging_specifications": {
            "thickness_micron_range": f"{top_packaging.thickness_micron_min}-{top_packaging.thickness_micron_max}",
            "otr_cc_m2_day": top_packaging.otr_cc_m2_day,
            "wvtr_g_m2_day": top_packaging.wvtr_g_m2_day,
            "sealability": top_packaging.sealability,
            "mechanical_strength": top_packaging.mechanical_strength,
            "light_barrier": top_packaging.light_barrier,
            "map_compatible": top_packaging.map_compatible,
        },
        "overall_score": top_score.final_score,
        "alternative_options": [
            {
                "material": pkg.name,
                "score": score.final_score,
                "cost_index": pkg.cost_index,
                "sustainability_score": pkg.sustainability_score,
            }
            for score, pkg in alt_rows
        ],
        "cost_analysis": {
            "cost_index": top_packaging.cost_index,
            "cost_level": recommendation.cost_level,
            "cost_score_contribution": top_score.cost_score,
        },
        "shelf_life_analysis": {
            "target_months": analysis.target_shelf_life_months,
            "estimated_months": top_score.estimated_shelf_life_months,
        },
        "before_after": ({
            "current": {
                "material": current_packaging.name,
                "cost_index": current_packaging.cost_index,
                "sustainability_score": current_packaging.sustainability_score,
                "recyclability_score": current_packaging.recyclability_score,
            },
            "recommended": {
                "material": top_packaging.name,
                "cost_index": top_packaging.cost_index,
                "sustainability_score": top_packaging.sustainability_score,
                "recyclability_score": top_packaging.recyclability_score,
                "suitability_score": top_score.final_score,
                "estimated_shelf_life_months": top_score.estimated_shelf_life_months,
            },
        } if current_packaging else None),
        "sustainability_analysis": {
            "sustainability_score": top_packaging.sustainability_score,
            "recyclability_score": top_packaging.recyclability_score,
            "sustainability_level": recommendation.sustainability_level,
        },
        "important_assumptions": ASSUMPTIONS,
        "disclaimer": DISCLAIMER,
    }

    if existing:
        existing.ai_explanation = explanation_text
        existing.ai_generated = ai_generated
        existing.content = content
        db.commit()
        db.refresh(existing)
        return existing

    report = Report(
        analysis_id=analysis_id,
        ai_explanation=explanation_text,
        ai_generated=ai_generated,
        content=content,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report
