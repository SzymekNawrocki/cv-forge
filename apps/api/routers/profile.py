from __future__ import annotations
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from db.base import get_session
from domain.schemas import UserProfileRead, UserProfileUpdate
from services.profile_service import get_or_create_profile, update_profile

router = APIRouter()


@router.get("/", response_model=UserProfileRead)
async def get_profile(session: AsyncSession = Depends(get_session)):
    return await get_or_create_profile(session)


@router.put("/", response_model=UserProfileRead)
async def put_profile(body: UserProfileUpdate, session: AsyncSession = Depends(get_session)):
    return await update_profile(session, body.model_dump())
