from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.algorithms.requirements_mapper import map_food_to_requirements
from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.analysis import Analysis
from app.models.food import FoodProduct
from app.models.packaging import PackagingMaterial
from app.models.packaging_score import PackagingScore
from app.models.recommendation import Recommendation
from app.models.user import User
from app.schemas.analysis import (
    AnalysisCreate, AnalysisOut, ComparisonOut, ExplanationRequestOut,
    PackagingScoreOut, RecommendationOut,
)
from app.schemas.report import ReportOut
from app.services import report_service
from app.services.analysis_service import create_analysis
from app.services.pdf_service import render_report_pdf

router = APIRouter(tags=["Analysis"])


def _get_owned_analysis(db: Session, analysis_id: int, user_id: int) -> Analysis:
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id, Analysis.user_id == user_id).first()
    if not analysis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")
    return analysis


@router.post("/analysis", response_model=AnalysisOut)
def post_analysis(payload: AnalysisCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return create_analysis(db, current_user.id, payload)


@router.get("/analysis/{analysis_id}", response_model=AnalysisOut)
def get_analysis(analysis_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return _get_owned_analysis(db, analysis_id, current_user.id)


def _score_rows(db: Session, analysis_id: int):
    return (
        db.query(PackagingScore, PackagingMaterial)
        .join(PackagingMaterial, PackagingScore.packaging_material_id == PackagingMaterial.id)
        .filter(PackagingScore.analysis_id == analysis_id)
        .order_by(PackagingScore.rank.asc())
        .all()
    )


def _to_score_out(score: PackagingScore, pkg: PackagingMaterial) -> PackagingScoreOut:
    return PackagingScoreOut(
        packaging_id=pkg.id,
        packaging_code=pkg.code,
        packaging_name=pkg.name,
        packaging_category=pkg.category,
        final_score=score.final_score,
        rank=int(score.rank),
        cost_index=pkg.cost_index,
        sustainability_score=pkg.sustainability_score,
        recyclability_score=pkg.recyclability_score,
        estimated_shelf_life_months=score.estimated_shelf_life_months,
        explanation_trace=score.explanation_trace,
    )


@router.get("/analysis/{analysis_id}/recommendation", response_model=RecommendationOut)
def get_recommendation(analysis_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    analysis = _get_owned_analysis(db, analysis_id, current_user.id)
    recommendation = db.query(Recommendation).filter(Recommendation.analysis_id == analysis_id).first()
    if not recommendation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recommendation not found")
    top_score = db.query(PackagingScore).filter(PackagingScore.id == recommendation.packaging_score_id).first()
    packaging = db.query(PackagingMaterial).filter(PackagingMaterial.id == recommendation.packaging_material_id).first()
    food = db.query(FoodProduct).filter(FoodProduct.id == analysis.food_product_id).first()

    requirements = map_food_to_requirements(
        moisture_pct=analysis.moisture_pct, fat_pct=analysis.fat_pct, ph=analysis.ph,
        oxygen_sensitivity=analysis.oxygen_sensitivity, light_sensitivity=analysis.light_sensitivity,
        fragility=food.fragility if food else "low",
        target_shelf_life_months=analysis.target_shelf_life_months,
        storage_temperature_c=analysis.storage_temperature_c,
        relative_humidity_pct=analysis.relative_humidity_pct,
        transportation_condition=analysis.transportation_condition,
    )

    return RecommendationOut(
        analysis_id=analysis_id,
        packaging_id=packaging.id,
        packaging_code=packaging.code,
        packaging_name=packaging.name,
        packaging_category=packaging.category,
        overall_suitability_pct=recommendation.overall_suitability_pct,
        cost_level=recommendation.cost_level,
        sustainability_level=recommendation.sustainability_level,
        estimated_shelf_life_months=recommendation.estimated_shelf_life_months,
        recommended_specifications={
            "thickness_micron_min": packaging.thickness_micron_min,
            "thickness_micron_max": packaging.thickness_micron_max,
            "otr_cc_m2_day": packaging.otr_cc_m2_day,
            "wvtr_g_m2_day": packaging.wvtr_g_m2_day,
            "sealability": packaging.sealability,
            "mechanical_strength": packaging.mechanical_strength,
            "light_barrier": packaging.light_barrier,
            "map_compatible": packaging.map_compatible,
            "cost_index": packaging.cost_index,
            "sustainability_score": packaging.sustainability_score,
            "recyclability_score": packaging.recyclability_score,
        },
        explanation_trace=top_score.explanation_trace,
        rules_fired=requirements.rules_fired,
    )


@router.get("/analysis/{analysis_id}/comparison", response_model=ComparisonOut)
def get_comparison(analysis_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _get_owned_analysis(db, analysis_id, current_user.id)
    rows = _score_rows(db, analysis_id)[:5]
    return ComparisonOut(analysis_id=analysis_id, candidates=[_to_score_out(s, p) for s, p in rows])


@router.post("/analysis/{analysis_id}/explanation", response_model=ExplanationRequestOut)
def post_explanation(analysis_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = report_service.build_report(db, analysis_id, current_user.id, force_regenerate=True)
    return ExplanationRequestOut(analysis_id=analysis_id, ai_generated=report.ai_generated, explanation=report.ai_explanation)


@router.get("/analysis/{analysis_id}/report", response_model=ReportOut)
def get_report(analysis_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = report_service.build_report(db, analysis_id, current_user.id)
    return ReportOut(
        analysis_id=analysis_id,
        food_information=report.content["food_information"],
        packaging_recommendation=report.content["packaging_recommendation"],
        packaging_specifications=report.content["packaging_specifications"],
        overall_score=report.content["overall_score"],
        alternative_options=report.content["alternative_options"],
        cost_analysis=report.content["cost_analysis"],
        shelf_life_analysis=report.content["shelf_life_analysis"],
        sustainability_analysis=report.content["sustainability_analysis"],
        decision_explanation=report.ai_explanation,
        important_assumptions=report.content["important_assumptions"],
        disclaimer=report.content["disclaimer"],
        ai_generated=report.ai_generated,
    )


@router.post("/analysis/{analysis_id}/report", response_model=ReportOut)
def regenerate_report(analysis_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = report_service.build_report(db, analysis_id, current_user.id, force_regenerate=True)
    return get_report(analysis_id, db, current_user)


@router.get("/analysis/{analysis_id}/report/pdf")
def get_report_pdf(analysis_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = report_service.build_report(db, analysis_id, current_user.id)
    pdf_bytes = render_report_pdf(report)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=packaging_report_{analysis_id}.pdf"},
    )
