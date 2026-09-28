# API Reference

Interactive documentation is also available at `/docs` (Swagger UI) and
`/redoc` once the backend is running.

Base URL (local dev): `http://localhost:8000`

## Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Register a new user. Returns a JWT + user. |
| POST | `/auth/login` | — | Log in. Returns a JWT + user. |
| GET | `/auth/me` | Bearer | Current user profile. |

All protected endpoints expect `Authorization: Bearer <token>`.

## Foods

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/foods` | — | List all food commodities (seeded + custom). |
| GET | `/foods/{id}` | — | Get one food commodity. |
| POST | `/foods` | Bearer | Create a custom food commodity. |
| PUT | `/foods/{id}` | Bearer | Update a food commodity. |
| DELETE | `/foods/{id}` | Bearer | Delete a food commodity. |

## Packaging

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/packaging` | — | List all packaging materials. |
| GET | `/packaging/{id}` | — | Get one packaging material. |
| POST | `/packaging` | Bearer | Create a packaging material. |
| PUT | `/packaging/{id}` | Bearer | Update a packaging material. |

## Analysis / Recommendation / Comparison / Report

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/analysis` | Bearer | Run a new analysis (food + overrides + priority). Triggers the full scoring pipeline. |
| GET | `/analysis/{id}` | Bearer | Get the analysis input snapshot. |
| GET | `/analysis/{id}/recommendation` | Bearer | Top-ranked packaging, specs, and full explanation trace. |
| GET | `/analysis/{id}/comparison` | Bearer | Top 5 candidates with per-dimension scores. |
| POST | `/analysis/{id}/explanation` | Bearer | (Re)generate the LLM/template explanation. |
| GET | `/analysis/{id}/report` | Bearer | Full structured report (generates one if it doesn't exist yet). |
| POST | `/analysis/{id}/report` | Bearer | Force-regenerate the report and explanation. |
| GET | `/analysis/{id}/report/pdf` | Bearer | Download the report as a PDF file. |

### `POST /analysis` request body

```json
{
  "food_product_id": 1,
  "moisture_pct": 2,
  "fat_pct": 35,
  "ph": 6.2,
  "target_shelf_life_months": 6,
  "storage_temperature_c": 25,
  "relative_humidity_pct": 65,
  "oxygen_sensitivity": "high",
  "light_sensitivity": "medium",
  "transportation_condition": "ambient",
  "priority": "balanced"
}
```

All fields except `food_product_id` are optional overrides — omitted
fields fall back to the selected food's seeded defaults. `priority` is one
of `balanced`, `cost`, `shelf_life`, `sustainability`, `protection`.

## Dashboard

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/dashboard/summary` | Bearer | Totals, recent analyses, most recommended packaging, average suitability. |

## Health

| Method | Path | Description |
|---|---|---|
| GET | `/` | Service status. |
| GET | `/health` | Health check. |
