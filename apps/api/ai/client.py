from __future__ import annotations
import json
import re
import httpx
from ai.prompts import ANALYZE_JD_PROMPT, CLEAN_CV_PROMPT, FORGE_SECTION_PROMPT, MATCH_SCORE_PROMPT

OLLAMA_BASE = "http://localhost:11434"
ANALYSIS_MODEL = "llama3.2:1b"
FORGE_MODEL = "qwen2.5-coder:3b"


class OllamaClient:
    async def _generate_json(self, prompt: str, model: str) -> dict:
        async with httpx.AsyncClient(timeout=120.0) as client:
            res = await client.post(
                f"{OLLAMA_BASE}/api/generate",
                json={"model": model, "prompt": prompt, "stream": False, "format": "json"},
            )
            res.raise_for_status()
        return _parse_json(res.json()["response"])

    async def analyze_jd(self, jd_text: str) -> dict:
        return await self._generate_json(
            ANALYZE_JD_PROMPT.format(jd_text=jd_text), ANALYSIS_MODEL
        )

    async def forge_section(self, section_content: str, keywords: list[str]) -> dict:
        return await self._generate_json(
            FORGE_SECTION_PROMPT.format(
                section_content=section_content,
                keywords=", ".join(keywords),
            ),
            FORGE_MODEL,
        )

    async def calculate_match_score(self, cv_text: str, jd_text: str) -> dict:
        return await self._generate_json(
            MATCH_SCORE_PROMPT.format(cv_text=cv_text, jd_text=jd_text), ANALYSIS_MODEL
        )

    async def clean_cv(self, raw_text: str) -> dict:
        return await self._generate_json(
            CLEAN_CV_PROMPT.format(raw_text=raw_text), ANALYSIS_MODEL
        )


def _parse_json(raw: str) -> dict:
    cleaned = re.sub(r"```(?:json)?\s*|\s*```", "", raw).strip()
    return json.loads(cleaned)
