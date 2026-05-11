from __future__ import annotations
import json
import os
import re
from google import genai
from google.genai import types
from groq import AsyncGroq
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

GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_LITE_MODEL = "gemini-2.5-flash-lite"
GROQ_MODEL = "llama-3.3-70b-versatile"

_gemini_client: genai.Client | None = None
_groq_client: AsyncGroq | None = None


def _get_gemini_client() -> genai.Client:
    global _gemini_client
    if _gemini_client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY not set in environment")
        _gemini_client = genai.Client(api_key=api_key)
    return _gemini_client


def _get_groq_client() -> AsyncGroq:
    global _groq_client
    if _groq_client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError(
                "All Gemini quotas exhausted and GROQ_API_KEY is not set. "
                "Get a free key at console.groq.com and add GROQ_API_KEY=... to apps/api/.env"
            )
        _groq_client = AsyncGroq(api_key=api_key)
    return _groq_client


def _is_rate_limited(e: Exception) -> bool:
    msg = str(e).lower()
    return any(kw in msg for kw in ("429", "rate_limit", "quota", "resource_exhausted", "too many requests"))


_JSON_CONFIG = types.GenerateContentConfig(
    response_mime_type="application/json"
)


class GeminiClient:
    async def _generate_json(self, prompt: str) -> dict:
        # Cascade: Gemini Flash -> Gemini Flash Lite -> Groq Llama 3.3 70B
        for model in [GEMINI_MODEL, GEMINI_LITE_MODEL]:
            try:
                response = await _get_gemini_client().aio.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=_JSON_CONFIG,
                )
                return _parse_json(response.text)
            except Exception as e:
                if _is_rate_limited(e):
                    print(f"[AI] {model} rate limited, trying next provider...")
                    continue
                raise

        print("[AI] Gemini quotas exhausted, falling back to Groq llama-3.3-70b-versatile...")
        groq = _get_groq_client()
        response = await groq.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": "Respond with valid JSON only. No markdown, no explanation."},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.6,
            max_tokens=4096,
        )
        return _parse_json(response.choices[0].message.content)

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


# Alias so existing import sites (routers/cv.py, forge_service.py) need no changes
OllamaClient = GeminiClient

# Keep backward-compat name used in some routers
_get_client = _get_gemini_client


def _parse_json(raw: str) -> dict:
    cleaned = re.sub(r"```(?:json)?\s*|\s*```", "", raw).strip()
    return json.loads(cleaned)
