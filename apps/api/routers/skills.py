from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from db.base import get_session
from domain.schemas import SkillCreate, SkillRead, SkillUpdate
from services.skills_service import create_skill, delete_skill, list_skills, update_skill

router = APIRouter()


@router.get("/", response_model=list[SkillRead])
async def get_skills(session: AsyncSession = Depends(get_session)):
    return await list_skills(session)


@router.post("/", response_model=SkillRead, status_code=201)
async def add_skill(body: SkillCreate, session: AsyncSession = Depends(get_session)):
    return await create_skill(body.category, body.items, session)


@router.put("/{skill_id}", response_model=SkillRead)
async def edit_skill(skill_id: int, body: SkillUpdate, session: AsyncSession = Depends(get_session)):
    try:
        return await update_skill(skill_id, body.category, body.items, session)
    except ValueError as e:
        raise HTTPException(404, str(e))


@router.delete("/{skill_id}", status_code=204)
async def remove_skill(skill_id: int, session: AsyncSession = Depends(get_session)):
    try:
        await delete_skill(skill_id, session)
    except ValueError as e:
        raise HTTPException(404, str(e))
