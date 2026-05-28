from __future__ import annotations
from typing import Awaitable, Callable
from ai.cascade import ModelCascade, ALL_MODELS, DEFAULT_MODEL, UsageCallback
from ai.prompts import (
    ANALYZE_JD_PROMPT,
    CLEAN_CV_JSON_PROMPT,
    FORMAT_CV_JSON_PROMPT,
    FORGE_PROMPTS,
    ForgeStrategy,
    PARSE_ENTRIES_PROMPT,
)
from ai.schemas import (
    CleanCVJSON,
    ForgeResult,
    JDAnalysis,
    ParsedEntries,
)

# Backwards-compat alias kept for any external callers
FREE_MODELS = ALL_MODELS


class OpenRouterClient:
    def __init__(
        self,
        preferred_model: str | None = None,
        usage_callback: UsageCallback | None = None,
    ):
        self.model = preferred_model or DEFAULT_MODEL
        self._cascade = ModelCascade(
            preferred_model=preferred_model,
            usage_callback=usage_callback,
        )

    def is_known_model(self, name: str) -> bool:
        return self._cascade.is_known_model(name)

    async def _generate_json(self, prompt: str) -> dict:
        return await self._cascade.generate_json(prompt)

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
        strategy: ForgeStrategy = ForgeStrategy.ANCHORED,
    ) -> ForgeResult:
        prompt_template = FORGE_PROMPTS[strategy]
        raw = await self._generate_json(
            prompt_template.format(
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

    async def clean_cv(self, raw_text: str) -> CleanCVJSON:
        raw = await self._generate_json(CLEAN_CV_JSON_PROMPT.format(raw_text=raw_text))
        return CleanCVJSON.model_validate(raw)

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
