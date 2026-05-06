from __future__ import annotations
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from db.models import MasterCV, JobDescription, TailoredCV
from domain.cv_logic.parser import FORGEABLE, split_sections, merge_sections
from ai.client import OllamaClient

logger = logging.getLogger(__name__)


async def import_cv(
    raw_text: str,
    title: str,
    ollama: OllamaClient,
    session: AsyncSession,
) -> MasterCV:
    result = await ollama.clean_cv(raw_text)
    md = result.get("markdown") or raw_text
    cv = MasterCV(title=title, content_markdown=md)
    session.add(cv)
    await session.commit()
    await session.refresh(cv)
    return cv


async def run_forge(
    master_cv_id: int,
    jd_text: str,
    ollama: OllamaClient,
    session: AsyncSession,
) -> TailoredCV:
    cv = await session.get(MasterCV, master_cv_id)
    if cv is None:
        raise ValueError(f"MasterCV {master_cv_id} not found")

    analysis = await ollama.analyze_jd(jd_text)
    keywords: list[str] = analysis.get("keywords", []) + analysis.get("required_skills", [])

    jd = JobDescription(raw_text=jd_text, extracted_keywords=", ".join(keywords))
    session.add(jd)
    await session.flush()

    before_result = await ollama.calculate_match_score(cv.content_markdown, jd_text)
    initial_score = float(before_result.get("score", 0))

    sections = split_sections(cv.content_markdown)
    forged: dict[str, str] = {}
    for title, content in sections.items():
        if title in FORGEABLE:
            result = await ollama.forge_section(content, keywords)
            forged[title] = result.get("rewritten") or content
        else:
            forged[title] = content

    tailored_md = merge_sections(forged)
    after_result = await ollama.calculate_match_score(tailored_md, jd_text)
    match_score = float(after_result.get("score", 0))

    if match_score < initial_score:
        logger.warning(
            "Score regression: before=%.1f after=%.1f (master_cv_id=%d)",
            initial_score, match_score, master_cv_id,
        )

    tailored = TailoredCV(
        master_cv_id=master_cv_id,
        job_desc_id=jd.id,
        content_markdown=tailored_md,
        initial_match_score=initial_score,
        match_score=match_score,
    )
    session.add(tailored)
    await session.commit()
    await session.refresh(tailored)
    return tailored
