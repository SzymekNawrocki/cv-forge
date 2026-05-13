from __future__ import annotations
import uuid
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from db.models import UserProfile


async def get_or_create_profile(session: AsyncSession, user_id: uuid.UUID) -> UserProfile:
    result = await session.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if profile is None:
        profile = UserProfile(user_id=user_id)
        session.add(profile)
        await session.commit()
        await session.refresh(profile)
    return profile


async def update_profile(session: AsyncSession, data: dict, user_id: uuid.UUID) -> UserProfile:
    profile = await get_or_create_profile(session, user_id=user_id)
    for key, value in data.items():
        setattr(profile, key, value)
    profile.updated_at = datetime.now(timezone.utc)
    await session.commit()
    await session.refresh(profile)
    return profile
