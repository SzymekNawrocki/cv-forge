from __future__ import annotations
import json
import logging
import re
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from db.models import MasterCV, JobDescription, TailoredCV
from domain.schemas import CVFormData
from ai.prompts import ForgeStrategy
from domain.cv_logic.forge_pipeline import forge_cv
from ai.client import OllamaClient
from services.skills_service import build_skills_markdown, list_skills
from services.profile_service import get_or_create_profile

logger = logging.getLogger(__name__)


class CVNotFoundError(Exception):
    pass


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


async def list_master_cvs(session: AsyncSession, user_id: uuid.UUID) -> list[MasterCV]:
    result = await session.execute(
        select(MasterCV).where(MasterCV.user_id == user_id).order_by(MasterCV.created_at.desc())
    )
    return list(result.scalars().all())


async def update_master_cv_links(
    cv_id: int,
    github_url: str | None,
    portfolio_url: str | None,
    session: AsyncSession,
    user_id: uuid.UUID,
) -> MasterCV:
    cv = await session.get(MasterCV, cv_id)
    if cv is None or cv.user_id != user_id:
        raise ValueError(f"CV {cv_id} not found")
    cv.github_url = github_url
    cv.portfolio_url = portfolio_url
    await session.commit()
    await session.refresh(cv)
    return cv


async def import_cv(
    raw_text: str,
    title: str,
    ollama: OllamaClient,
    session: AsyncSession,
    user_id: uuid.UUID,
    github_url: str | None = None,
    portfolio_url: str | None = None,
) -> MasterCV:
    result = await ollama.clean_cv(raw_text)
    md = _normalize_cv_markdown(result.markdown or raw_text)
    cv = MasterCV(
        title=title,
        content_markdown=md,
        user_id=user_id,
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
    user_id: uuid.UUID,
) -> MasterCV:
    md = _form_to_markdown(data)
    cv = MasterCV(
        title=data.title,
        content_markdown=md,
        user_id=user_id,
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
    session: AsyncSession,
    user_id: uuid.UUID,
    strategy: ForgeStrategy = ForgeStrategy.ANCHORED,
) -> tuple[TailoredCV, list[str]]:
    # Phase 1: short DB transaction — load all needed data, commit JD early.
    # This releases the connection before AI calls so Neon idle timeout can't kill it.
    profile = await get_or_create_profile(session, user_id)
    preferred = profile.preferred_model
    ollama = OllamaClient(preferred_model=preferred)
    if preferred and not ollama.is_known_model(preferred):
        logger.warning("preferred_model %s is stale, resetting to default", preferred)
        profile.preferred_model = None
        await session.commit()
        preferred = None
        ollama = OllamaClient(preferred_model=None)

    cv = await session.get(MasterCV, master_cv_id)
    if cv is None or cv.user_id != user_id:
        raise CVNotFoundError(f"MasterCV {master_cv_id} not found")

    # Capture everything we need before commit expires the ORM objects
    cv_markdown = cv.content_markdown
    cv_github_url = cv.github_url
    cv_portfolio_url = cv.portfolio_url

    db_skills = await list_skills(session, user_id=user_id)
    skills_md = build_skills_markdown(db_skills) if db_skills else None

    jd = JobDescription(raw_text=jd_text, user_id=user_id)
    session.add(jd)
    await session.commit()  # releases DB connection before AI calls
    jd_id = jd.id

    # Phase 2: all AI calls — no DB connection held
    output = await forge_cv(
        cv_markdown=cv_markdown,
        skills_markdown=skills_md,
        jd_text=jd_text,
        provider=ollama,
        github_url=cv_github_url,
        portfolio_url=cv_portfolio_url,
        strategy=strategy,
    )

    # Phase 3: short DB transaction — save results with a fresh connection
    jd_obj = await session.get(JobDescription, jd_id)
    if jd_obj:
        jd_obj.extracted_keywords = ", ".join(output.keywords)

    tailored = TailoredCV(
        master_cv_id=master_cv_id,
        job_desc_id=jd_id,
        content_json=json.dumps(output.content_json),
        initial_match_score=output.initial_score,
        match_score=output.match_score,
    )
    session.add(tailored)
    await session.commit()
    await session.refresh(tailored)
    return tailored, output.failed_sections
