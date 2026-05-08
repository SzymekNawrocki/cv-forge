from __future__ import annotations
import json
import logging
import re
from sqlalchemy.ext.asyncio import AsyncSession
from db.models import MasterCV, JobDescription, TailoredCV
from domain.cv_logic.parser import FORGEABLE, split_sections, merge_sections
from domain.cv_logic.cv_json_builder import build_cv_json
from ai.client import OllamaClient
from services.skills_service import build_skills_markdown, list_skills

logger = logging.getLogger(__name__)


def _normalize_cv_markdown(md: str) -> str:
    """Strip double ## prefixes that Gemini sometimes produces in clean_cv output."""
    lines = []
    for line in md.split("\n"):
        line = re.sub(r'^##\s+#\s+', '# ', line)
        line = re.sub(r'^##\s+##\s+', '## ', line)
        lines.append(line)
    return "\n".join(lines)


async def import_cv(
    raw_text: str,
    title: str,
    ollama: OllamaClient,
    session: AsyncSession,
) -> MasterCV:
    result = await ollama.clean_cv(raw_text)
    md = _normalize_cv_markdown(result.get("markdown") or raw_text)
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
    required_kw: list[str] = analysis.get("required_skills", [])
    nice_kw: list[str] = analysis.get("nice_to_have", [])
    keywords: list[str] = analysis.get("keywords", []) + required_kw
    job_title: str = analysis.get("job_title", "")

    jd = JobDescription(raw_text=jd_text, extracted_keywords=", ".join(keywords))
    session.add(jd)
    await session.flush()

    before_result = await ollama.calculate_match_score(
        cv.content_markdown, jd_text,
        required_keywords=required_kw,
        nice_to_have_keywords=nice_kw,
    )
    initial_score = min(float(before_result.get("score", 0)), 100.0)

    missing_critical: list[str] = before_result.get("missing_critical", [])
    missing_nice_to_have: list[str] = before_result.get("missing_nice_to_have", [])
    missing_set = set(missing_critical + missing_nice_to_have)
    existing_keywords = [k for k in keywords if k not in missing_set]

    sections = split_sections(cv.content_markdown)

    # If skills DB has entries, replace the Skills section so AI selects from the full list
    db_skills = await list_skills(session)
    if db_skills:
        skills_md = build_skills_markdown(db_skills)
        # Find the correct key (case-insensitive match)
        skills_key = next((k for k in sections if k.lower() == "skills"), "Skills")
        sections[skills_key] = skills_md

    forged: dict[str, str] = {}
    for title, content in sections.items():
        if title.lower() in FORGEABLE:
            result = await ollama.forge_section(
                section_name=title,
                section_content=content,
                keywords=keywords,
                job_title=job_title,
                full_cv=cv.content_markdown,
                missing_critical=missing_critical,
                missing_nice_to_have=missing_nice_to_have,
                existing_keywords=existing_keywords,
            )
            forged[title] = result.get("rewritten") or content
        else:
            forged[title] = content

    tailored_md = merge_sections(forged)
    after_result = await ollama.calculate_match_score(
        tailored_md, jd_text,
        required_keywords=required_kw,
        nice_to_have_keywords=nice_kw,
    )
    match_score = min(float(after_result.get("score", 0)), 100.0)

    if match_score < initial_score:
        logger.warning(
            "Score regression: before=%.1f after=%.1f (master_cv_id=%d)",
            initial_score, match_score, master_cv_id,
        )

    cv_json_result = await build_cv_json(tailored_md, ollama)
    content_json = json.dumps(cv_json_result)

    tailored = TailoredCV(
        master_cv_id=master_cv_id,
        job_desc_id=jd.id,
        content_json=content_json,
        initial_match_score=initial_score,
        match_score=match_score,
    )
    session.add(tailored)
    await session.commit()
    await session.refresh(tailored)
    return tailored
