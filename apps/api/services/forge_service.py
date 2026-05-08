from __future__ import annotations
import json
import logging
import re
from sqlalchemy.ext.asyncio import AsyncSession
from db.models import MasterCV, JobDescription, TailoredCV
from domain.cv_logic.parser import FORGEABLE, split_sections, merge_sections
from domain.cv_logic.cv_json_builder import build_cv_json
from domain.schemas import CVFormData
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


def _form_to_markdown(data: CVFormData) -> str:
    """Generate canonical CV markdown from structured form data. No AI call needed."""
    lines: list[str] = []

    lines.append(f"# {data.name}")
    lines.append(data.job_title)
    if data.email:
        lines.append(data.email)
    if data.phone:
        lines.append(data.phone)
    link_parts = []
    if data.portfolio_url:
        link_parts.append(data.portfolio_url)
    if data.github_url:
        link_parts.append(data.github_url)
    if link_parts:
        lines.append(" | ".join(link_parts))
    if data.location:
        lines.append(data.location)
    lines.append("")

    if data.about_me:
        lines += ["## About Me", "", data.about_me.strip(), ""]

    if data.skills:
        lines.append("## Skills")
        lines.append("")
        for sc in data.skills:
            if sc.items:
                lines.append(f"- **{sc.category}:** {', '.join(sc.items)}")
        lines.append("")

    if data.projects:
        lines.append("## Projects")
        lines.append("")
        for p in data.projects:
            desc = p.description.strip()
            if p.date_range:
                desc = f"{desc} ({p.date_range})"
            lines.append(f"- **{p.name}:** {desc}")
        lines.append("")

    if data.work_experience:
        lines.append("## Work Experience")
        lines.append("")
        for exp in data.work_experience:
            lines.append(f"### {exp.company}")
            lines.append(f"{exp.role} | {exp.date_range}")
            for bullet in exp.bullets:
                if bullet.strip():
                    lines.append(f"- {bullet.strip()}")
            lines.append("")

    if data.education:
        lines.append("## Education")
        lines.append("")
        for edu in data.education:
            lines.append(f"- **{edu.institution}:** {edu.degree} | {edu.years}")
        lines.append("")

    if data.languages:
        lines.append("## Languages")
        lines.append("")
        for lang in data.languages:
            lines.append(f"- {lang.language}: {lang.level}")
        lines.append("")

    if data.certifications:
        lines.append("## Certifications")
        lines.append("")
        for cert in data.certifications:
            cert_str = f"{cert.name} {cert.year}".strip() if cert.year else cert.name
            lines.append(f"- **{cert_str}**")
        lines.append("")

    return "\n".join(lines).strip()


async def import_cv(
    raw_text: str,
    title: str,
    ollama: OllamaClient,
    session: AsyncSession,
    github_url: str | None = None,
    portfolio_url: str | None = None,
) -> MasterCV:
    result = await ollama.clean_cv(raw_text)
    md = _normalize_cv_markdown(result.get("markdown") or raw_text)
    cv = MasterCV(
        title=title,
        content_markdown=md,
        github_url=github_url or None,
        portfolio_url=portfolio_url or None,
    )
    session.add(cv)
    await session.commit()
    await session.refresh(cv)
    return cv


async def create_cv_from_form(
    data: CVFormData,
    session: AsyncSession,
) -> MasterCV:
    md = _form_to_markdown(data)
    cv = MasterCV(
        title=data.title,
        content_markdown=md,
        github_url=data.github_url or None,
        portfolio_url=data.portfolio_url or None,
    )
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

    # Only inject full DB skills when CV has no existing skills content (Option B).
    # Form-created CVs with explicit skill selections are preserved.
    db_skills = await list_skills(session)
    if db_skills:
        skills_key = next((k for k in sections if k.lower() == "skills"), None)
        has_skills = bool(skills_key and sections.get(skills_key, "").strip())
        if not has_skills:
            sections[skills_key or "Skills"] = build_skills_markdown(db_skills)

    forged: dict[str, str] = {}
    for sec_title, content in sections.items():
        if sec_title.lower() in FORGEABLE:
            result = await ollama.forge_section(
                section_name=sec_title,
                section_content=content,
                keywords=keywords,
                job_title=job_title,
                full_cv=cv.content_markdown,
                missing_critical=missing_critical,
                missing_nice_to_have=missing_nice_to_have,
                existing_keywords=existing_keywords,
            )
            forged[sec_title] = result.get("rewritten") or content
        else:
            forged[sec_title] = content

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

    cv_json_result = await build_cv_json(
        tailored_md, ollama,
        github_url=cv.github_url,
        portfolio_url=cv.portfolio_url,
    )
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
