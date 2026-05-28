from __future__ import annotations
import asyncio
import dataclasses
import logging

from ai.prompts import ForgeStrategy
from domain.cv_logic.parser import FORGEABLE, split_sections, merge_sections
from domain.cv_logic.cv_json_builder import build_cv_json
from domain.cv_logic.match_score import calculate_match_score

logger = logging.getLogger(__name__)

TARGET_SCORE = 90.0
_FORGE_CONCURRENCY = 3


@dataclasses.dataclass
class ForgeOutput:
    tailored_md: str
    content_json: dict
    initial_score: float
    match_score: float
    keywords: list[str]
    failed_sections: list[str]


async def _forge_one(
    sem: asyncio.Semaphore,
    sec_title: str,
    content: str,
    provider: object,
    *,
    keywords: list[str],
    job_title: str,
    full_cv: str,
    missing_critical: list[str],
    missing_nice_to_have: list[str],
    existing_keywords: list[str],
    strategy: ForgeStrategy,
) -> tuple[str, str | None]:
    """Returns (sec_title, rewritten_body | None if failed)."""
    async with sem:
        try:
            result = await provider.forge_section(  # type: ignore[attr-defined]
                section_name=sec_title,
                section_content=content,
                keywords=keywords,
                job_title=job_title,
                full_cv=full_cv,
                missing_critical=missing_critical,
                missing_nice_to_have=missing_nice_to_have,
                existing_keywords=existing_keywords,
                strategy=strategy,
            )
            return sec_title, result.rewritten or None
        except Exception:
            logger.exception("forge_section failed for %s", sec_title)
            return sec_title, None


async def forge_cv(
    cv_markdown: str,
    skills_markdown: str | None,
    jd_text: str,
    provider: object,
    github_url: str | None,
    portfolio_url: str | None,
    strategy: ForgeStrategy = ForgeStrategy.ANCHORED,
) -> ForgeOutput:
    """Pure, DB-free forge pipeline. Inject a fake provider to test without a database."""

    analysis = await provider.analyze_jd(jd_text)  # type: ignore[attr-defined]
    required_kw: list[str] = analysis.required_skills
    nice_kw: list[str] = analysis.nice_to_have
    keywords: list[str] = analysis.keywords + required_kw
    job_title: str = analysis.job_title

    initial_score, missing_critical, missing_nice_to_have = calculate_match_score(
        cv_markdown, required_kw, nice_kw
    )
    missing_set = set(missing_critical + missing_nice_to_have)
    existing_keywords = [k for k in keywords if k not in missing_set]

    sections = split_sections(cv_markdown)

    # Inject full DB skills only when the CV has no existing skills content (Option B).
    if skills_markdown:
        skills_key = next((k for k in sections if k.lower() == "skills"), None)
        has_skills = bool(skills_key and sections.get(skills_key, "").strip())
        if not has_skills:
            sections[skills_key or "Skills"] = skills_markdown

    # Parallel forge with bounded concurrency
    sem = asyncio.Semaphore(_FORGE_CONCURRENCY)
    forge_kwargs = dict(
        keywords=keywords,
        job_title=job_title,
        full_cv=cv_markdown,
        missing_critical=missing_critical,
        missing_nice_to_have=missing_nice_to_have,
        existing_keywords=existing_keywords,
        strategy=strategy,
    )
    tasks = [
        _forge_one(sem, title, content, provider, **forge_kwargs)
        for title, content in sections.items()
        if title.lower() in FORGEABLE
    ]
    results: list[tuple[str, str | None]] = await asyncio.gather(*tasks)
    forge_map = dict(results)

    # Rebuild forged dict in original section order
    forged: dict[str, str] = {}
    failed_sections: list[str] = []
    for sec_title, content in sections.items():
        if sec_title.lower() in FORGEABLE:
            rewritten = forge_map.get(sec_title)
            if rewritten:
                forged[sec_title] = rewritten
            else:
                forged[sec_title] = content
                failed_sections.append(sec_title)
        else:
            forged[sec_title] = content

    tailored_md = merge_sections(forged)
    match_score, after_missing_critical, after_missing_nice = calculate_match_score(
        tailored_md, required_kw, nice_kw
    )

    if match_score < initial_score:
        logger.warning("Score regression: before=%.1f after=%.1f", initial_score, match_score)

    # Bounded one-pass retry for aggressive mode when score is below target
    if (
        strategy is ForgeStrategy.AGGRESSIVE
        and match_score < TARGET_SCORE
        and after_missing_critical
    ):
        retry_kwargs = dict(
            keywords=keywords,
            job_title=job_title,
            full_cv=tailored_md,
            missing_critical=after_missing_critical,
            missing_nice_to_have=[],
            existing_keywords=existing_keywords,
            strategy=ForgeStrategy.AGGRESSIVE,
        )
        retry_tasks = [
            _forge_one(sem, title, content, provider, **retry_kwargs)
            for title, content in forged.items()
            if title.lower() in FORGEABLE
        ]
        retry_results: list[tuple[str, str | None]] = await asyncio.gather(*retry_tasks)
        for sec_title, rewritten in retry_results:
            if rewritten:
                forged[sec_title] = rewritten
        tailored_md = merge_sections(forged)
        match_score, _, _ = calculate_match_score(tailored_md, required_kw, nice_kw)

    content_json = await build_cv_json(
        tailored_md, provider,
        github_url=github_url,
        portfolio_url=portfolio_url,
    )

    return ForgeOutput(
        tailored_md=tailored_md,
        content_json=content_json,
        initial_score=initial_score,
        match_score=match_score,
        keywords=keywords,
        failed_sections=failed_sections,
    )
