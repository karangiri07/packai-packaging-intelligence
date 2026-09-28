from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.analysis import Analysis
from app.models.food import FoodProduct
from app.models.packaging import PackagingMaterial
from app.models.recommendation import Recommendation
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary")
def dashboard_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_analyses = db.query(func.count(Analysis.id)).filter(Analysis.user_id == current_user.id).scalar() or 0
    total_foods = db.query(func.count(FoodProduct.id)).scalar() or 0
    total_packaging = db.query(func.count(PackagingMaterial.id)).scalar() or 0

    recent_analyses = (
        db.query(Analysis)
        .filter(Analysis.user_id == current_user.id)
        .order_by(Analysis.created_at.desc())
        .limit(5)
        .all()
    )

    user_analysis_ids = [a.id for a in db.query(Analysis.id).filter(Analysis.user_id == current_user.id).all()]
    recommendations = (
        db.query(Recommendation)
        .filter(Recommendation.analysis_id.in_(user_analysis_ids))
        .all()
        if user_analysis_ids else []
    )

    most_recommended = None
    avg_suitability = 0.0
    if recommendations:
        pkg_ids = [r.packaging_material_id for r in recommendations]
        counter = Counter(pkg_ids)
        top_pkg_id, _ = counter.most_common(1)[0]
        top_pkg = db.query(PackagingMaterial).filter(PackagingMaterial.id == top_pkg_id).first()
        most_recommended = top_pkg.name if top_pkg else None
        avg_suitability = round(sum(r.overall_suitability_pct for r in recommendations) / len(recommendations), 1)

    return {
        "total_analyses": total_analyses,
        "total_food_products": total_foods,
        "total_packaging_materials": total_packaging,
        "recent_analyses": [
            {
                "id": a.id,
                "food_name": a.food_name,
                "priority": a.priority,
                "created_at": a.created_at.isoformat(),
            }
            for a in recent_analyses
        ],
        "most_recommended_packaging": most_recommended,
        "average_suitability_score": avg_suitability,
        "recommendations_count": len(recommendations),
    }
