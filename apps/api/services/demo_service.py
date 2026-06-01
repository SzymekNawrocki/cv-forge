from __future__ import annotations

import os
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from db.models import User

DEMO_ENABLED: bool = os.environ.get("DEMO_MODE", "false").lower() in ("1", "true", "yes")


async def create_demo_user(user_manager, session: AsyncSession) -> User:
    """Create an ephemeral demo user, bypassing email verification flow."""
    password = str(uuid.uuid4())
    hashed = user_manager.password_helper.hash(password)
    user = User(
        id=uuid.uuid4(),
        email=f"demo+{uuid.uuid4()}@cvforge.demo",
        hashed_password=hashed,
        is_active=True,
        is_verified=True,
        is_superuser=False,
        is_demo=True,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def seed_demo_user(session: AsyncSession, user_id: uuid.UUID) -> None:
    """Populate a demo user with sample CV, skills, and profile."""
    from services.forge_service import create_cv_from_form
    from services.profile_service import get_or_create_profile
    from services.skills_service import create_skill
    from domain.schemas import (
        CVFormData,
        SkillCategoryEntry,
        WorkExperienceEntry,
        ProjectEntry,
        EducationEntry,
        LanguageEntry,
    )

    profile = await get_or_create_profile(session, user_id)
    profile.name = "Alex Demo"
    profile.job_title = "Junior Software Developer"
    profile.email = "alex.demo@example.com"
    profile.location = "London, UK"
    profile.github_url = "https://github.com/alexdemo"
    profile.portfolio_url = "https://alexdemo.dev"
    await session.commit()

    await create_skill("Languages", ["Python", "JavaScript", "TypeScript", "SQL"], session, user_id)
    await create_skill("Frameworks", ["React", "FastAPI", "Node.js"], session, user_id)
    await create_skill("Tools", ["Git", "Docker", "PostgreSQL", "VS Code"], session, user_id)

    form = CVFormData(
        title="Alex Demo — Master CV",
        name="Alex Demo",
        job_title="Junior Software Developer",
        email="alex.demo@example.com",
        phone="+44 7000 000000",
        location="London, UK",
        github_url="https://github.com/alexdemo",
        portfolio_url="https://alexdemo.dev",
        about_me=(
            "Recent Computer Science graduate with hands-on experience building web applications "
            "using Python and JavaScript. Passionate about clean code and building user-focused products."
        ),
        skills=[
            SkillCategoryEntry(category="Languages", items=["Python", "JavaScript", "TypeScript", "SQL"]),
            SkillCategoryEntry(category="Frameworks", items=["React", "FastAPI", "Node.js"]),
            SkillCategoryEntry(category="Tools", items=["Git", "Docker", "PostgreSQL"]),
        ],
        work_experience=[
            WorkExperienceEntry(
                company="TechStartup Ltd",
                role="Software Developer Intern",
                date_range="Jun 2024 – Sep 2024",
                bullets=[
                    "Built REST API endpoints with FastAPI serving 10k+ daily requests",
                    "Implemented React dashboard components reducing load time by 30%",
                    "Wrote unit tests increasing code coverage from 45% to 78%",
                ],
            ),
        ],
        projects=[
            ProjectEntry(
                name="CV Forge",
                description=(
                    "AI-powered CV tailoring tool built with Next.js and FastAPI. "
                    "Integrated OpenRouter LLMs for keyword-based CV rewriting"
                ),
                date_range="2024",
            ),
            ProjectEntry(
                name="Budget Tracker App",
                description="Full-stack expense tracking app with authentication, charts, and CSV export. 200+ GitHub stars",
                date_range="2023",
            ),
        ],
        education=[
            EducationEntry(
                institution="University of Manchester",
                degree="BSc Computer Science",
                years="2021–2024",
            ),
        ],
        languages=[
            LanguageEntry(language="English", level="Native"),
            LanguageEntry(language="Spanish", level="B1"),
        ],
    )
    await create_cv_from_form(form, session, user_id=user_id)


def build_canned_forge_result() -> tuple[dict, float, float]:
    """Return a pre-baked forge result (content_json dict, initial_score, final_score)."""
    content_json: dict = {
        "name": "Alex Demo",
        "title": "Junior Software Developer",
        "contact": {
            "email": "alex.demo@example.com",
            "phone": "+44 7000 000000",
            "location": "London, UK",
            "portfolio": "https://alexdemo.dev",
            "github": "https://github.com/alexdemo",
        },
        "sections": [
            {
                "heading": "ABOUT ME",
                "type": "paragraph",
                "content": (
                    "Computer Science graduate with 1 year of professional experience delivering REST APIs "
                    "and React dashboards in an Agile environment. Strong foundation in Python, "
                    "JavaScript/TypeScript, and SQL with hands-on exposure to Docker, CI/CD pipelines, "
                    "and PostgreSQL. Eager to contribute to a fast-paced engineering team where software "
                    "quality and product impact are valued."
                ),
            },
            {
                "heading": "SKILLS",
                "type": "bullets",
                "items": [
                    "**Languages:** Python, JavaScript, TypeScript, SQL, HTML/CSS",
                    "**Frameworks:** React, FastAPI, Node.js, Express",
                    "**Tools:** Git, Docker, PostgreSQL, GitHub Actions, VS Code",
                    "**Practices:** REST API design, Agile/Scrum, unit testing, code review",
                ],
            },
            {
                "heading": "WORK EXPERIENCE",
                "type": "entries",
                "entries": [
                    {
                        "org": "TechStartup Ltd",
                        "role": "Software Developer Intern",
                        "date": "Jun 2024 – Sep 2024",
                        "bullets": [
                            "Designed and shipped 12 REST API endpoints with FastAPI and PostgreSQL, handling 10k+ daily requests at 99.9% uptime",
                            "Built 8 React dashboard components integrated with REST APIs, cutting average page load time by 30%",
                            "Increased automated test coverage from 45% to 78% using pytest and React Testing Library",
                            "Collaborated in daily stand-ups and sprint retrospectives within an Agile Scrum team of 6 engineers",
                        ],
                    },
                ],
            },
            {
                "heading": "PROJECTS",
                "type": "bullets",
                "items": [
                    "**CV Forge (2024):** AI-powered CV tailoring tool built with Next.js 16 and FastAPI. Integrated OpenRouter LLMs for keyword-based CV rewriting, achieving measurable ATS score improvements",
                    "**Budget Tracker App (2023):** Full-stack personal finance app with JWT authentication, Chart.js visualisations, and CSV export. 200+ GitHub stars, deployed on Railway",
                ],
            },
            {
                "heading": "EDUCATION",
                "type": "bullets",
                "items": [
                    "**University of Manchester:** BSc Computer Science | 2021–2024",
                ],
            },
            {
                "heading": "LANGUAGES",
                "type": "bullets",
                "items": ["English: Native", "Spanish: B1"],
            },
        ],
    }
    return content_json, 62.0, 88.0
