from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import analysis, auth, dashboard, foods, packaging
from app.core.config import get_settings
from app.database.init_db import init_and_seed

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Structured multi-factor scoring engine for food packaging recommendation, "
        "with an LLM explanation layer. See /docs for the interactive API reference."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_and_seed()


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "service": settings.APP_NAME}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}


app.include_router(auth.router)
app.include_router(foods.router)
app.include_router(packaging.router)
app.include_router(analysis.router)
app.include_router(dashboard.router)
