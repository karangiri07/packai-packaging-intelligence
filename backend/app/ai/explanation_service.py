"""
Explanation Service
====================
Takes the ALREADY-DECIDED structured result from the scoring/optimization
engine and produces a natural-language explanation. The LLM is never asked
"which packaging should this food use" - it is only given the winning
candidate, its score breakdown, and the runner-up alternatives, and asked
to narrate WHY, describe trade-offs, and note limitations. If no LLM is
configured, a deterministic template built from the same structured data
is used instead, so the explanation is always available.
"""
from typing import Dict, List

from app.ai.llm_client import call_llm

SYSTEM_PROMPT = (
    "You are a packaging engineering assistant helping a student explain a "
    "food packaging recommendation to hackathon judges. You are given a "
    "structured scoring result that was already computed by a separate, "
    "non-AI decision engine. Do not change or second-guess the recommended "
    "material or its rank - only explain it. Be concise, use plain "
    "language, and organize your answer under these headings: Why This "
    "Packaging, Key Food Characteristics, Key Packaging Characteristics, "
    "Trade-offs, Alternative Options, Limitations. Keep the whole answer "
    "under 350 words."
)


def _build_user_prompt(context: Dict) -> str:
    lines = [
        f"Food: {context['food_name']}",
        f"Optimization priority: {context['priority']}",
        f"Recommended packaging: {context['top']['packaging_name']} "
        f"(overall suitability {context['top']['final_score']}/100, "
        f"estimated shelf life ~{context['top']['estimated_shelf_life_months']} months, "
        f"cost level {context['top']['cost_level']}, sustainability {context['top']['sustainability_level']}).",
        "Score breakdown for the recommended packaging:",
    ]
    for item in context["top"]["trace"]:
        lines.append(
            f"- {item['dimension']}: {item['match']} "
            f"(contributed {item['contribution_pct']}/{item['max_pct']} points). "
            f"{item['packaging_property']}"
        )
    lines.append("Top alternative candidates:")
    for alt in context["alternatives"]:
        lines.append(f"- {alt['packaging_name']}: score {alt['final_score']}/100")
    return "\n".join(lines)


def _template_fallback(context: Dict) -> str:
    top = context["top"]
    lines = [
        "**Why This Packaging?**",
        f"{top['packaging_name']} scored highest ({top['final_score']}/100) for {context['food_name']} "
        f"under the '{context['priority']}' optimization priority, based on the weighted multi-factor scoring engine.",
        "",
        "**Key Food Characteristics**",
        f"The analysis considered moisture, fat content, pH, oxygen/light sensitivity, target shelf life, "
        f"storage temperature and humidity for {context['food_name']}.",
        "",
        "**Key Packaging Characteristics**",
    ]
    for item in top["trace"]:
        lines.append(f"- {item['dimension']}: {item['match']} — {item['packaging_property']}")
    lines += [
        "",
        "**Trade-offs**",
        f"This selection balances protection, cost ({top['cost_level']}) and sustainability "
        f"({top['sustainability_level']}) according to the chosen priority. A different priority "
        "would shift these weights and could change the ranking.",
        "",
        "**Alternative Options**",
    ]
    for alt in context["alternatives"]:
        lines.append(f"- {alt['packaging_name']}: score {alt['final_score']}/100")
    lines += [
        "",
        "**Limitations**",
        "This is a decision-support prototype using approximate demo material properties. "
        "It is not a substitute for laboratory shelf-life testing or regulatory certification.",
    ]
    return "\n".join(lines)


def generate_explanation(*, food_name: str, priority: str, top: Dict, alternatives: List[Dict]):
    context = {"food_name": food_name, "priority": priority, "top": top, "alternatives": alternatives}
    llm_text = call_llm(SYSTEM_PROMPT, _build_user_prompt(context))
    if llm_text:
        return llm_text, True
    return _template_fallback(context), False
