from __future__ import annotations
import json
import logging
import os
import re
import time
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

_GROQ_BASE = "https://api.groq.com/openai/v1"
GROQ_MODELS = [
    "llama-3.3-70b-versatile",
    "meta-llama/llama-4-scout-17b-16e-instruct",
]

_OPENROUTER_BASE = "https://openrouter.ai/api/v1"
_OPENROUTER_HEADERS = {"HTTP-Referer": "https://cv-forge.app", "X-Title": "CV Forge"}
OPENROUTER_MODELS = [
    "google/gemma-4-26b-a4b-it:free",
    "google/gemma-4-31b-it:free",
    "qwen/qwen3-next-80b-a3b-instruct:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
]

ALL_MODELS: list[str] = GROQ_MODELS + OPENROUTER_MODELS
DEFAULT_MODEL = "llama-3.3-70b-versatile"
_COOLDOWN_SECONDS = 60.0

_model_cooldowns: dict[str, float] = {}
_groq_client: AsyncOpenAI | None = None
_openrouter_client: AsyncOpenAI | None = None


def _get_groq_client() -> AsyncOpenAI | None:
    global _groq_client
    if _groq_client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            return None
        _groq_client = AsyncOpenAI(api_key=api_key, base_url=_GROQ_BASE, max_retries=0)
    return _groq_client


def _get_openrouter_client() -> AsyncOpenAI | None:
    global _openrouter_client
    if _openrouter_client is None:
        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            return None
        _openrouter_client = AsyncOpenAI(api_key=api_key, base_url=_OPENROUTER_BASE, max_retries=0)
    return _openrouter_client


def _is_cooling(model: str) -> bool:
    expiry = _model_cooldowns.get(model)
    if expiry is None:
        return False
    if time.monotonic() >= expiry:
        del _model_cooldowns[model]
        return False
    return True


def _set_cooldown(model: str) -> None:
    _model_cooldowns[model] = time.monotonic() + _COOLDOWN_SECONDS


def _is_rate_limit_error(e: Exception) -> bool:
    msg = str(e).lower()
    return any(kw in msg for kw in (
        "429", "rate_limit", "quota", "resource_exhausted", "too many requests",
    ))


def _is_transient_error(e: Exception) -> bool:
    msg = str(e).lower()
    return any(kw in msg for kw in (
        "429", "rate_limit", "quota", "resource_exhausted", "too many requests",
        "503", "unavailable", "high demand", "try again",
        "404", "no endpoints found", "not found",
        "413", "payload too large", "request entity too large",
        "decommissioned", "no longer supported",
    ))


def parse_json(raw: str) -> dict:
    cleaned = re.sub(r"```(?:json)?\s*|\s*```", "", raw).strip()
    return json.loads(cleaned)


class ModelCascade:
    """Ordered model list + cooldown policy. Single interface: generate_json(prompt) -> dict."""

    def __init__(self, preferred_model: str | None = None) -> None:
        self._preferred = preferred_model or DEFAULT_MODEL

    @property
    def models(self) -> list[str]:
        return list(ALL_MODELS)

    def is_known_model(self, name: str) -> bool:
        return name in ALL_MODELS

    def _build_entries(self) -> list[tuple[str, AsyncOpenAI, dict]]:
        groq = _get_groq_client()
        openrouter = _get_openrouter_client()

        groq_cascade = [self._preferred] if self._preferred in GROQ_MODELS else []
        groq_cascade += [m for m in GROQ_MODELS if m != self._preferred]

        or_cascade = [self._preferred] if self._preferred in OPENROUTER_MODELS else []
        or_cascade += [m for m in OPENROUTER_MODELS if m != self._preferred]

        entries: list[tuple[str, AsyncOpenAI, dict]] = []
        if groq:
            entries += [(m, groq, {}) for m in groq_cascade]
        if openrouter:
            entries += [(m, openrouter, _OPENROUTER_HEADERS) for m in or_cascade]
        return entries

    async def generate_json(self, prompt: str) -> dict:
        entries = self._build_entries()
        if not entries:
            raise RuntimeError("No AI clients configured — set GROQ_API_KEY or OPENROUTER_API_KEY")

        groq = _get_groq_client()
        for model, client, extra_headers in entries:
            if _is_cooling(model):
                logger.debug("Skipping %s (rate-limited, cooling down)", model)
                continue
            try:
                provider = "Groq" if client is groq else "OpenRouter"
                logger.info("[%s] Trying %s...", provider, model)
                response = await client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": "Respond with valid JSON only. No markdown fences, no explanation."},
                        {"role": "user", "content": prompt},
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.6,
                    max_tokens=8192,
                    extra_headers=extra_headers,
                )
                content = response.choices[0].message.content if response.choices else None
                if not content:
                    logger.warning("[%s] %s returned empty response, trying next...", provider, model)
                    continue
                try:
                    return parse_json(content)
                except json.JSONDecodeError:
                    logger.warning("[%s] %s returned invalid JSON, trying next...", provider, model)
                    continue
            except Exception as e:
                if _is_transient_error(e):
                    if _is_rate_limit_error(e):
                        _set_cooldown(model)
                    logger.warning("[%s] %s failed (%s), trying next...", provider, model, type(e).__name__)
                    continue
                raise
        raise RuntimeError("All models exhausted — try again later.")
