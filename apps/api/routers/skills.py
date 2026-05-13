from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from auth.config import current_active_verified_user
from db.base import get_session
from db.models import User
from domain.schemas import SkillCreate, SkillRead, SkillUpdate
from services.skills_service import create_skill, delete_skill, list_skills, update_skill

router = APIRouter()


@router.get("/", response_model=list[SkillRead])
async def get_skills(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(current_active_verified_user),
):
    return await list_skills(session, user_id=user.id)


@router.post("/", response_model=SkillRead, status_code=201)
async def add_skill(
    body: SkillCreate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(current_active_verified_user),
):
    return await create_skill(body.category, body.items, session, user_id=user.id)


@router.put("/{skill_id}", response_model=SkillRead)
async def edit_skill(
    skill_id: int,
    body: SkillUpdate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(current_active_verified_user),
):
    try:
        return await update_skill(skill_id, body.category, body.items, session, user_id=user.id)
    except ValueError as e:
        raise HTTPException(404, str(e))


@router.delete("/{skill_id}", status_code=204)
async def remove_skill(
    skill_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(current_active_verified_user),
):
    try:
        await delete_skill(skill_id, session, user_id=user.id)
    except ValueError as e:
        raise HTTPException(404, str(e))
