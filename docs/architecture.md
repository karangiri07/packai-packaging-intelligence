# Architecture

## Overview

```
React Frontend (Vite)
        |
        v
FastAPI REST API
        |
        v
JWT Authentication
        |
        v
Food Data / Packaging Data  (PostgreSQL / SQLite via SQLAlchemy)
        |
        v
Preprocessing (Requirements Mapper)
        |
        v
Multi-Factor Packaging Decision Engine (Scoring Engine)
        |
        v
Packaging Candidate Scoring (per-candidate 7-dimension breakdown)
        |
        v
Optimization Engine (priority weighting + protection floor)
        |
        v
Recommended Packaging
        |
        v
LLM Explanation Layer (optional, with offline template fallback)
        |
        v
Report / Dashboard
```

## Why the decision engine is separate from the LLM

The core requirement of this project is that packaging selection must be
**explainable and reproducible** — the same inputs must always produce the
same ranking, and every point of the final score must be traceable to a
specific rule. An LLM is non-deterministic and can hallucinate technical
claims, so it is never given the power to choose or reorder packaging
candidates. It only receives the already-computed structured result and is
asked to narrate it.

Concretely:

- `app/algorithms/requirements_mapper.py` — pure Python, converts food +
  environment inputs into 0-10 packaging requirement targets, with a
  human-readable rule trace.
- `app/algorithms/scoring_engine.py` — pure Python, compares each of the 12
  packaging candidates against the requirements across 7 dimensions and
  produces a 0-100 final score plus a full contribution trace.
- `app/algorithms/optimizer.py` — pure Python, applies priority-specific
  minimum-protection floors before final ranking.
- `app/ai/explanation_service.py` + `app/ai/llm_client.py` — the only place
  an LLM API call happens. It receives the finished result, never the raw
  inputs, and cannot alter the ranking. If no `LLM_API_KEY` is configured
  or the call fails, a deterministic template built from the same trace
  data is used instead.

## Backend layout

```
backend/app/
  core/        settings, JWT + password hashing
  database/    SQLAlchemy engine/session, table creation + seeding
  models/      SQLAlchemy ORM models (users, food_products, packaging_materials,
               analyses, packaging_scores, recommendations, reports)
  schemas/     Pydantic request/response models
  algorithms/  requirements_mapper, scoring_engine, optimizer, weights
  services/    orchestration + CRUD (auth, food, packaging, analysis, report, pdf)
  ai/          LLM client + explanation service
  api/routes/  FastAPI routers (auth, foods, packaging, analysis, dashboard)
  main.py      FastAPI app instance, CORS, startup seeding
```

## Frontend layout

```
frontend/src/
  pages/       one file per screen (Landing, Login, Register, Dashboard,
               FoodAnalysis, Recommendation, Comparison, Optimization,
               Reports, ReportDetail, FoodDatabase, PackagingDatabase, About)
  layouts/     MainLayout (sidebar navigation shell for authenticated pages)
  components/  shared UI (score indicators, states, analysis picker, protected route)
  charts/      Recharts wrappers (bar, scatter, radar)
  services/    api.js - axios client with JWT attach + typed endpoint helpers
  hooks/       useAuth (auth context), useToast (notifications)
```

## Data flow for one analysis

1. User selects a food (seeded or custom) on the Food Analysis screen, optionally
   overrides its properties, and picks an optimization priority.
2. `POST /analysis` creates an `Analysis` row (a snapshot of the inputs used).
3. The backend calls `map_food_to_requirements(...)` to derive packaging
   requirements from those inputs.
4. Every `PackagingMaterial` in the database is scored against those
   requirements with `score_all_candidates(...)`.
5. `optimize(...)` applies the priority's protection floor and re-ranks.
6. Each candidate's score + explanation trace is persisted as a
   `PackagingScore` row; the top-ranked candidate becomes the `Recommendation`.
7. The frontend fetches `/analysis/{id}/recommendation` (top pick),
   `/analysis/{id}/comparison` (top 5), and, on demand,
   `/analysis/{id}/report` (which triggers the LLM/template explanation and
   assembles the full report content) and its PDF rendering.
