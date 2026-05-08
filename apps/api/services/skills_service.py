from __future__ import annotations
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from db.models import Skill


async def list_skills(session: AsyncSession) -> list[Skill]:
    result = await session.execute(select(Skill).order_by(Skill.created_at))
    return list(result.scalars().all())


async def create_skill(category: str, items: list[str], session: AsyncSession) -> Skill:
    skill = Skill(category=category, items=items)
    session.add(skill)
    await session.commit()
    await session.refresh(skill)
    return skill


async def update_skill(skill_id: int, category: str | None, items: list[str] | None, session: AsyncSession) -> Skill:
    skill = await session.get(Skill, skill_id)
    if skill is None:
        raise ValueError(f"Skill {skill_id} not found")
    if category is not None:
        skill.category = category
    if items is not None:
        skill.items = items
    await session.commit()
    await session.refresh(skill)
    return skill


async def delete_skill(skill_id: int, session: AsyncSession) -> None:
    skill = await session.get(Skill, skill_id)
    if skill is None:
        raise ValueError(f"Skill {skill_id} not found")
    await session.delete(skill)
    await session.commit()


def build_skills_markdown(skills: list[Skill]) -> str:
    """Convert Skill rows to the canonical ## Skills section body (no heading)."""
    lines = [f"- **{s.category}:** {', '.join(s.items)}" for s in skills]
    return "\n".join(lines)
