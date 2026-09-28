"""
Thin wrapper around an OpenAI-compatible chat completions endpoint.

The LLM is used ONLY for the natural-language explanation/report layer -
never for the actual packaging decision. If no API key is configured (or
the call fails for any reason, e.g. no network in this environment), the
caller receives None and the explanation_service falls back to a
deterministic, template-based narrative built directly from the scoring
engine's own explanation trace. This keeps the app's core workflow fully
functional offline/without credentials, as required for a hackathon demo.
"""
from typing import Optional

import httpx

from app.core.config import get_settings

settings = get_settings()


def call_llm(system_prompt: str, user_prompt: str) -> Optional[str]:
    if not settings.LLM_API_KEY:
        return None
    try:
        response = httpx.post(
            f"{settings.LLM_API_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.LLM_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.LLM_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "max_tokens": 900,
                "temperature": 0.4,
            },
            timeout=20.0,
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"].strip()
    except Exception:
        # Any failure (no network, invalid key, rate limit, etc.) falls
        # back to the template-based explanation - the app must never
        # break because the optional LLM layer is unavailable.
        return None
