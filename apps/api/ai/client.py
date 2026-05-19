from __future__ import annotations
import json
import logging
import os
import re
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

from ai.prompts import (
    ANALYZE_JD_PROMPT,
    CLEAN_CV_PROMPT,
    FORMAT_CV_JSON_PROMPT,
    FORGE_SECTION_PROMPT,
    MATCH_SCORE_PROMPT,
    PARSE_ENTRIES_PROMPT,
)
from ai.schemas import (
    CleanCVResult,
    ForgeResult,
    JDAnalysis,
    MatchScore,
    ParsedEntries,
)

# Groq — primary (fast LPU inference, ~1-3s per call)
_GROQ_BASE = "https://api.groq.com/openai/v1"
GROQ_MODELS = [
    "llama-3.3-70b-versatile",
    "qwen/qwen3-32b",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "llama-3.1-8b-instant",
]

# OpenRouter — fallback when Groq is rate-limited
_OPENROUTER_BASE = "https://openrouter.ai/api/v1"
_OPENROUTER_HEADERS = {"HTTP-Referer": "https://cv-forge.app", "X-Title": "CV Forge"}
OPENROUTER_MODELS = [
    "google/gemma-4-26b-a4b-it:free",
    "google/gemma-4-31b-it:free",
    "qwen/qwen3-next-80b-a3b-instruct:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
]

FREE_MODELS = GROQ_MODELS + OPENROUTER_MODELS
DEFAULT_MODEL = "llama-3.3-70b-versatile"

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


def _is_transient_error(e: Exception) -> bool:
    msg = str(e).lower()
    return any(kw in msg for kw in (
        "429", "rate_limit", "quota", "resource_exhausted", "too many requests",
        "503", "unavailable", "high demand", "try again",
        "404", "no endpoints found", "not found",
        "413", "payload too large", "request entity too large",
        "decommissioned", "no longer supported",
    ))


class OpenRouterClient:
    def __init__(self, preferred_model: str | None = None):
        self.model = preferred_model or DEFAULT_MODEL

    async def _generate_json(self, prompt: str) -> dict:
        # Build cascade: preferred model first, then remaining Groq, then OpenRouter fallback
        groq_cascade = [self.model] if self.model in GROQ_MODELS else []
        groq_cascade += [m for m in GROQ_MODELS if m != self.model]

        or_cascade = [self.model] if self.model in OPENROUTER_MODELS else []
        or_cascade += [m for m in OPENROUTER_MODELS if m != self.model]

        groq = _get_groq_client()
        openrouter = _get_openrouter_client()

        entries: list[tuple[str, AsyncOpenAI, dict]] = []
        if groq:
            entries += [(m, groq, {}) for m in groq_cascade]
        if openrouter:
            entries += [(m, openrouter, _OPENROUTER_HEADERS) for m in or_cascade]

        if not entries:
            raise RuntimeError("No AI clients configured — set GROQ_API_KEY or OPENROUTER_API_KEY")

        for model, client, extra_headers in entries:
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
                    return _parse_json(content)
                except json.JSONDecodeError:
                    logger.warning("[%s] %s returned invalid JSON, trying next...", provider, model)
                    continue
            except Exception as e:
                if _is_transient_error(e):
                    logger.warning("[%s] %s failed (%s), trying next...", provider, model, type(e).__name__)
                    continue
                raise
        raise RuntimeError("All models exhausted — try again later.")

    async def analyze_jd(self, jd_text: str) -> JDAnalysis:
        raw = await self._generate_json(ANALYZE_JD_PROMPT.format(jd_text=jd_text))
        return JDAnalysis.model_validate(raw)

    async def forge_section(
        self,
        section_name: str,
        section_content: str,
        keywords: list[str],
        job_title: str,
        full_cv: str,
        missing_critical: list[str] | None = None,
        missing_nice_to_have: list[str] | None = None,
        existing_keywords: list[str] | None = None,
    ) -> ForgeResult:
        raw = await self._generate_json(
            FORGE_SECTION_PROMPT.format(
                section_name=section_name,
                section_content=section_content,
                keywords=", ".join(keywords),
                job_title=job_title,
                full_cv=full_cv,
                missing_critical=", ".join(missing_critical or []) or "none identified",
                missing_nice_to_have=", ".join(missing_nice_to_have or []) or "none identified",
                existing_keywords=", ".join(existing_keywords or []) or "none identified",
            )
        )
        return ForgeResult.model_validate(raw)

    async def calculate_match_score(
        self,
        cv_text: str,
        jd_text: str,
        required_keywords: list[str] | None = None,
        nice_to_have_keywords: list[str] | None = None,
    ) -> MatchScore:
        raw = await self._generate_json(
            MATCH_SCORE_PROMPT.format(
                cv_text=cv_text,
                jd_text=jd_text,
                required_keywords=", ".join(required_keywords or []) or "derive from job description",
                nice_to_have_keywords=", ".join(nice_to_have_keywords or []) or "derive from job description",
            )
        )
        return MatchScore.model_validate(raw)

    async def clean_cv(self, raw_text: str) -> CleanCVResult:
        raw = await self._generate_json(CLEAN_CV_PROMPT.format(raw_text=raw_text))
        return CleanCVResult.model_validate(raw)

    async def format_cv_json(self, cv_markdown: str) -> dict:
        return await self._generate_json(
            FORMAT_CV_JSON_PROMPT.format(cv_markdown=cv_markdown)
        )

    async def parse_entries_section(self, section_name: str, section_content: str) -> list[dict]:
        raw = await self._generate_json(
            PARSE_ENTRIES_PROMPT.format(
                section_name=section_name,
                section_content=section_content,
            )
        )
        return [entry.model_dump() for entry in ParsedEntries.model_validate(raw).entries]


OllamaClient = OpenRouterClient


def _parse_json(raw: str) -> dict:
    cleaned = re.sub(r"```(?:json)?\s*|\s*```", "", raw).strip()
    return json.loads(cleaned)
