# PackAI — AI-Powered Multi-Factor Food Packaging Recommendation & Optimization System

A hackathon/college project that recommends the most suitable food
packaging material and specifications by running a **transparent,
non-LLM multi-factor scoring engine** against structured food and
packaging data — then uses an LLM only to explain the result in plain
language.

## Table of Contents

- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Scoring Methodology (summary)](#scoring-methodology-summary)
- [Where AI/LLM Is Used](#where-aillm-is-used)
- [Database Structure](#database-structure)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Running the Backend](#running-the-backend)
- [Running the Frontend](#running-the-frontend)
- [Seeding the Database](#seeding-the-database)
- [Running Tests](#running-tests)
- [Demo Scenarios](#demo-scenarios)
- [Demo Credentials](#demo-credentials)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Known Limitations](#known-limitations)
- [Future Scope](#future-scope)

## Problem Statement

Different food commodities require different packaging solutions
depending on their physical/chemical properties (moisture, fat, pH,
oxygen/light sensitivity) and the conditions under which they are stored
and transported. Choosing packaging by convention rather than by evidence
leads to shortened shelf life, wasted cost, or unmet sustainability goals.

## Solution

PackAI converts food and environmental inputs into structured packaging
requirements, scores 12 realistic packaging candidates against those
requirements across 7 weighted dimensions, applies priority-based
optimization (Balanced / Lowest Cost / Maximum Shelf Life / Maximum
Sustainability / Maximum Protection), and only then asks an LLM to narrate
*why* the winning candidate was chosen. See [`docs/methodology.md`](docs/methodology.md)
for the full scoring math and [`docs/architecture.md`](docs/architecture.md)
for the system design.

## Features

- Multi-factor, explainable decision engine (no hardcoded answers)
- Priority-based dynamic optimization with safety floors
- 12-material packaging dataset, 8-commodity food dataset (both editable)
- JWT authentication with secure password hashing
- Full packaging comparison with sortable/filterable table + charts
- AI-generated (or offline template-based) natural-language explanation
- Professional report generation with PDF download
- Dashboard with aggregate insights
- Demo Mode with 5 one-click scenarios for judge walkthroughs

## Architecture

```
React Frontend → FastAPI REST API → JWT Auth → Food/Packaging Data (DB)
→ Requirements Mapper → Multi-Factor Scoring Engine → Optimization Engine
→ Recommendation → LLM Explanation Layer (optional, with fallback) → Report/Dashboard
```

Full diagram and rationale: [`docs/architecture.md`](docs/architecture.md).

## Technology Stack

**Frontend:** React, Vite, JavaScript, Tailwind CSS, Recharts, React Router, Axios
**Backend:** Python, FastAPI, Pydantic, SQLAlchemy
**Database:** PostgreSQL (production) / SQLite (zero-setup local demo)
**AI:** Any OpenAI-compatible chat completions API (optional — offline template fallback included)
**Auth:** JWT (python-jose) + bcrypt password hashing (passlib)

## Scoring Methodology (summary)

1. **Requirements Mapper** — rule-based conversion of food/environment inputs into 0-10 packaging requirement targets, with a human-readable rule trace.
2. **Scoring Engine** — compares all 12 candidates against those requirements across Oxygen Protection, Moisture Protection, Mechanical Protection, Shelf Life, Cost, Sustainability, and Compatibility.
3. **Weight Profiles** — priority selection changes the weighting (out of 100 points), never the underlying fit calculation.
4. **Optimizer** — enforces a minimum protection floor under cost/sustainability-heavy priorities.

Full details: [`docs/methodology.md`](docs/methodology.md).

## Where AI/LLM Is Used

**Only** in `backend/app/ai/explanation_service.py` and `llm_client.py`,
called **after** the decision engine has already picked and ranked the
candidates. The LLM receives the structured result (winner, score
breakdown, alternatives) and is instructed not to change the ranking —
only to narrate why, describe trade-offs, and flag limitations. If
`LLM_API_KEY` is unset or the call fails for any reason (e.g. no network),
a deterministic template built from the same structured data is used
instead, so the app is fully functional offline.

## Database Structure

Tables (SQLAlchemy models in `backend/app/models/`):

- `users` — auth accounts
- `food_products` — seeded + custom food commodities
- `packaging_materials` — the 12 candidate packaging materials
- `analyses` — one row per analysis run (input snapshot)
- `packaging_scores` — per-candidate score + explanation trace for an analysis
- `recommendations` — the top-ranked candidate for an analysis
- `reports` — generated report content + AI/template explanation

## Project Structure

```
project-root/
  frontend/            React + Vite + Tailwind app
    src/
      pages/ components/ layouts/ services/ hooks/ charts/
  backend/             FastAPI app
    app/
      api/ core/ models/ schemas/ services/ algorithms/ database/ ai/ utils/
    tests/
    requirements.txt
    .env.example
  data/
    foods.json
    packaging.json
  scripts/
    seed_database.py
  docs/
    architecture.md
    methodology.md
    api.md
  .env.example
  README.md
```

## Installation & Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- (Optional for production) A PostgreSQL instance

### Clone and enter the project

```bash
cd project-root
```

## Environment Variables

Copy the example files and adjust as needed:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Backend (`backend/.env`):

| Variable | Default | Notes |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./packaging_demo.db` | Set to a PostgreSQL URL for production |
| `JWT_SECRET_KEY` | (dev placeholder) | **Change for any real deployment** |
| `JWT_ALGORITHM` | `HS256` | |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | |
| `LLM_API_KEY` | *(blank)* | Leave blank to use the offline template fallback |
| `LLM_API_BASE_URL` | `https://api.openai.com/v1` | Any OpenAI-compatible endpoint |
| `LLM_MODEL` | `gpt-4o-mini` | |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | For CORS |

Frontend (`frontend/.env`):

| Variable | Default |
|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` |

Never commit real `.env` files or API keys.

## Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

## Running the Backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

The app creates tables and seeds demo foods/packaging automatically on
startup (SQLite by default — zero external setup required). API docs at
`http://localhost:8000/docs`.

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

## Running the Frontend

```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173`.

## Seeding the Database

Seeding happens automatically on backend startup. To run it manually
(e.g. against a fresh PostgreSQL database):

```bash
python scripts/seed_database.py
```

Safe to re-run — it only seeds tables that are currently empty.

## Running Tests

```bash
cd backend
pytest -v
```

Covers: authentication, food CRUD + validation, packaging retrieval, the
scoring engine's pure logic (rule mapping, weight profiles, ranking
behavior), and the full register → login → analyze → recommend →
compare → explain → report → PDF workflow.

## Demo Scenarios

The Food Analysis screen includes one-click demo scenarios for judges:

1. Potato Chips (high oxygen sensitivity, high fat — tests barrier + oil resistance weighting)
2. Milk (refrigerated, short shelf life)
3. Spices (high light sensitivity, dry powder)
4. Rice (low sensitivity, long shelf life, bulk dry good)
5. Pickles (low pH/acidic, low sensitivity — MAP logic mostly bypassed by acidity)

Select any priority (Balanced, Lowest Cost, Maximum Shelf Life, Maximum
Sustainability, Maximum Protection) on the Optimization screen to see the
ranking dynamically recompute.

## Demo Credentials

No seeded user accounts are shipped (passwords are hashed and there's no
reason to ship a real one). Register a new account from the Register page
— it takes seconds and works fully offline.

## API Documentation

See [`docs/api.md`](docs/api.md) or the live Swagger UI at `/docs` once
the backend is running.

## Deployment

- **Frontend → Vercel:** set `VITE_API_BASE_URL` to your deployed backend URL as a Vercel environment variable, then deploy the `frontend/` directory (`npm run build` → `dist/`).
- **Backend → Render:** deploy the `backend/` directory as a Python web service (`uvicorn app.main:app --host 0.0.0.0 --port $PORT`), set `DATABASE_URL` to your hosted PostgreSQL connection string, `JWT_SECRET_KEY` to a strong random value, `FRONTEND_ORIGIN` to your deployed frontend URL, and (optionally) `LLM_API_KEY`.
- **Database → any hosted PostgreSQL** (Render Postgres, Supabase, Neon, etc.) — just set `DATABASE_URL`; the app creates and seeds tables automatically on first startup.

## Known Limitations

- Packaging material properties (OTR, WVTR, barrier scores, cost/sustainability indices) are **approximate demo values**, not laboratory-certified specifications.
- Shelf-life estimates use a disclosed heuristic (barrier-headroom model), not accelerated shelf-life testing or a trained predictive model.
- The LLM explanation layer requires an OpenAI-compatible API key to produce AI-generated (rather than template-based) narrative text; without one, the app still functions fully using the template fallback.
- This is a decision-support prototype, not a substitute for laboratory testing, food safety validation, or regulatory certification (see the disclaimer shown in every report).

## Future Scope

- Real laboratory data integration
- IoT temperature/humidity monitoring feeding live analyses
- Real-time shelf-life prediction from accelerated aging data
- Computer vision for food quality assessment
- Carbon footprint / LCA-based sustainability scoring
- Supply-chain optimization across multiple packaging suppliers
- Manufacturer/vendor database with real, quoted pricing
- An ML model trained on experimental packaging performance data, used alongside (not instead of) the transparent scoring engine
