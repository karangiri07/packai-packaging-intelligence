import io
import re
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

from app.models.report import Report


def _safe_markup(text: str) -> str:
    """Escape XML-special characters (LLM output may contain & or <) and
    convert **bold** markdown into reportlab <b> tags."""
    escaped = escape(text or "")
    escaped = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", escaped)
    return escaped.replace("\n", "<br/>")


def render_report_pdf(report: Report) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1.5 * cm, bottomMargin=1.5 * cm)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("TitleX", parent=styles["Title"], fontSize=18)
    heading_style = ParagraphStyle("HeadingX", parent=styles["Heading2"], spaceBefore=12, spaceAfter=6)
    body_style = styles["BodyText"]

    content = report.content or {}
    food = content.get("food_information", {})
    pkg = content.get("packaging_recommendation", {})
    current = content.get("current_packaging")
    before_after = content.get("before_after")
    specs = content.get("packaging_specifications", {})
    alts = content.get("alternative_options", [])

    story = [
        Paragraph("Food Packaging Recommendation Report", title_style),
        Spacer(1, 12),
        Paragraph(f"Food: {food.get('name', '-')}", body_style),
        Paragraph(f"Optimization priority: {food.get('priority', '-')}", body_style),
        Spacer(1, 6),

        Paragraph("Food Information", heading_style),
        Table(
            [[k.replace("_", " ").title(), str(v)] for k, v in food.items()],
            colWidths=[7 * cm, 9 * cm],
        ),

        *([Paragraph("Current vs Recommended", heading_style), Table(
            [["Metric", "Current", "Recommended"],
             ["Material", current.get("material", "-"), pkg.get("material", "-")],
             ["Cost index", str(current.get("cost_index", "-")), str(pkg.get("cost_index", "-"))],
             ["Sustainability", str(current.get("sustainability_score", "-")), str(pkg.get("sustainability_score", "-"))],
            ], colWidths=[5 * cm, 5 * cm, 6 * cm]
        )] if current else []),

        Paragraph("Packaging Recommendation", heading_style),
        Paragraph(f"Material: {pkg.get('material', '-')} ({pkg.get('category', '-')})", body_style),
        Paragraph(f"Overall suitability: {pkg.get('overall_suitability_pct', '-')}/100", body_style),

        Paragraph("Packaging Specifications", heading_style),
        Table(
            [[k.replace("_", " ").title(), str(v)] for k, v in specs.items()],
            colWidths=[7 * cm, 9 * cm],
        ),

        Paragraph("Alternative Options", heading_style),
        Table(
            [["Material", "Score", "Cost Index", "Sustainability"]] + [
                [a.get("material"), a.get("score"), a.get("cost_index"), a.get("sustainability_score")]
                for a in alts
            ],
            colWidths=[6 * cm, 3 * cm, 3 * cm, 4 * cm],
        ),

        Paragraph("Decision Explanation", heading_style),
        Paragraph(_safe_markup(report.ai_explanation), body_style),

        Paragraph("Important Assumptions", heading_style),
        *[Paragraph("- " + escape(a), body_style) for a in content.get("important_assumptions", [])],

        Paragraph("Disclaimer", heading_style),
        Paragraph(escape(content.get("disclaimer", "")), body_style),
    ]

    table_style = TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("BACKGROUND", (0, 0), (-1, 0), colors.whitesmoke),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
    ])
    for item in story:
        if isinstance(item, Table):
            item.setStyle(table_style)

    doc.build(story)
    return buffer.getvalue()
