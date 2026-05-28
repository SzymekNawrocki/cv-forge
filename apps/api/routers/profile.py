from __future__ import annotations
from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from auth.config import current_active_verified_user
from db.base import get_session
from db.models import AICallLog, User
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


@router.get("/usage")
async def get_usage(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(current_active_verified_user),
):
    today_start = datetime.combine(date.today(), datetime.min.time()).replace(tzinfo=timezone.utc)
    result = await session.execute(
        select(
            func.coalesce(func.sum(AICallLog.prompt_tokens + AICallLog.completion_tokens), 0).label("total_tokens"),
            func.count().label("call_count"),
            func.coalesce(func.sum(AICallLog.prompt_tokens), 0).label("prompt_tokens"),
            func.coalesce(func.sum(AICallLog.completion_tokens), 0).label("completion_tokens"),
        ).where(
            AICallLog.user_id == user.id,
            AICallLog.created_at >= today_start,
        )
    )
    row = result.one()
    return {
        "total_tokens_today": int(row.total_tokens),
        "call_count_today": int(row.call_count),
        "prompt_tokens_today": int(row.prompt_tokens),
        "completion_tokens_today": int(row.completion_tokens),
    }
