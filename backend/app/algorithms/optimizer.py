"""
Optimization Engine
====================
Sits after candidate scoring. Applies priority-specific guard rails so that,
for example, "Lowest Cost" never recommends a packaging that provides
dangerously little barrier protection - it favors cheap options only among
those meeting a minimum protection floor. This keeps the optimizer from
producing an unsafe recommendation just because it's the cheapest.
"""
from typing import List

from app.algorithms.scoring_engine import CandidateScoreResult

MIN_PROTECTION_FLOOR = {
    # Minimum acceptable weakest of oxygen/moisture/mechanical fit (0-1) even under
    # cost/sustainability-heavy priorities.
    "cost": 0.6,
    "sustainability": 0.6,
    "balanced": 0.0,
    "shelf_life": 0.0,
    "protection": 0.0,
}


def optimize(results: List[CandidateScoreResult], priority: str) -> List[CandidateScoreResult]:
    floor = MIN_PROTECTION_FLOOR.get((priority or "balanced").lower(), 0.0)
    if floor <= 0:
        return results

    def protection_avg(r: CandidateScoreResult) -> float:
        # Weakest critical dimension decides: a great oxygen barrier must not
        # mask a badly inadequate mechanical strength (e.g. glass for frozen food).
        return min(r.oxygen_protection_score, r.moisture_protection_score, r.mechanical_protection_score)

    qualifying = [r for r in results if protection_avg(r) >= floor]
    if qualifying:
        qualifying.sort(key=lambda r: r.final_score, reverse=True)
        return qualifying
    # Nothing meets the floor (rare/edge case) - fall back to full ranking
    # rather than returning an empty recommendation set.
    return results
