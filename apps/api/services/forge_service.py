from __future__ import annotations
import json
import uuid
import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from db.models import AICallLog, MasterCV, JobDescription, TailoredCV
from domain.schemas import (
    CVFormData,
    SkillCategoryEntry,
    ProjectEntry,
    WorkExperienceEntry,
    EducationEntry,
    LanguageEntry,
    CertificationEntry,
)
from ai.client import OllamaClient
from ai.schemas import CleanCVJSON
from ai.prompts import ForgeStrategy
from domain.cv_logic.forge_pipeline import forge_cv
from services.skills_service import build_skills_markdown, list_skills
from services.profile_service import get_or_create_profile

log = structlog.get_logger()


class CVNotFoundError(Exception):
    pass


def _clean_cv_json_to_form_data(
    cleaned: CleanCVJSON,
    title: str,
    github_url: str | None,
    portfolio_url: str | None,
) -> CVFormData:
    """Convert AI-extracted CleanCVJSON into a CVFormData ready for _form_to_markdown."""
    return CVFormData(
        title=title,
        github_url=github_url or cleaned.github_url or "",
        portfolio_url=portfolio_url or cleaned.portfolio_url or "",
        name=cleaned.name or "Unknown",
        job_title=cleaned.job_title or "Professional",
        email=cleaned.email or "",
        phone=cleaned.phone or "",
        location=cleaned.location or "",
        about_me=cleaned.about_me or "",
        skills=[SkillCategoryEntry(category=s.category, items=s.items) for s in cleaned.skills],
        projects=[ProjectEntry(name=p.name, description=p.description, url=p.url, date_range=p.date_range) for p in cleaned.projects],
        work_experience=[WorkExperienceEntry(company=e.company, role=e.role, date_range=e.date_range, bullets=e.bullets) for e in cleaned.work_experience],
        education=[EducationEntry(institution=e.institution, degree=e.degree, years=e.years) for e in cleaned.education],
        languages=[LanguageEntry(language=l.language, level=l.level) for l in cleaned.languages],
        certifications=[CertificationEntry(name=c.name, url=c.url, year=c.year) for c in cleaned.certifications],
    )


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
    cleaned = await ollama.clean_cv(raw_text)
    form_data = _clean_cv_json_to_form_data(cleaned, title, github_url, portfolio_url)
    md = _form_to_markdown(form_data)
    cv = MasterCV(
        title=title,
        content_markdown=md,
        user_id=user_id,
        github_url=form_data.github_url or None,
        portfolio_url=form_data.portfolio_url or None,
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
    usage_log: list[dict] = []

    async def _collect_usage(model: str, prompt_tokens: int, completion_tokens: int, latency_ms: int) -> None:
        usage_log.append({
            "model": model,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "latency_ms": latency_ms,
        })

    ollama = OllamaClient(preferred_model=preferred, usage_callback=_collect_usage)
    if preferred and not ollama.is_known_model(preferred):
        log.warning("preferred_model_stale", model=preferred)
        profile.preferred_model = None
        await session.commit()
        preferred = None
        ollama = OllamaClient(preferred_model=None, usage_callback=_collect_usage)

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

    # Phase 3: short DB transaction — save results + usage logs with a fresh connection
    jd_obj = await session.get(JobDescription, jd_id)
    if jd_obj:
        jd_obj.extracted_keywords = ", ".join(output.keywords)

    tailored = TailoredCV(
        master_cv_id=master_cv_id,
        job_desc_id=jd_id,
        content_json=json.dumps(output.content_json),
        initial_match_score=output.initial_score,
        match_score=output.match_score,
        strategy=strategy.value,
    )
    session.add(tailored)

    for entry in usage_log:
        session.add(AICallLog(
            user_id=user_id,
            model=entry["model"],
            prompt_tokens=entry["prompt_tokens"],
            completion_tokens=entry["completion_tokens"],
            latency_ms=entry["latency_ms"],
            success=True,
        ))

    await session.commit()
    await session.refresh(tailored)
    return tailored, output.failed_sections
