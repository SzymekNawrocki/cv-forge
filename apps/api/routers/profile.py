from __future__ import annotations
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from auth.config import current_active_verified_user
from db.base import get_session
from db.models import User
from domain.schemas import UserProfileRead, UserProfileUpdate
from services.profile_service import get_or_create_profile, update_profile

router = APIRouter()


@router.get("/", response_model=UserProfileRead)
async def get_profile(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(current_active_verified_user),
):
    return await get_or_create_profile(session, user_id=user.id)


@router.put("/", response_model=UserProfileRead)
async def put_profile(
    body: UserProfileUpdate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(current_active_verified_user),
):
    return await update_profile(session, body.model_dump(), user_id=user.id)
