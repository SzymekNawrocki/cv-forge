from __future__ import annotations
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from db.models import UserProfile


async def get_or_create_profile(session: AsyncSession) -> UserProfile:
    result = await session.execute(select(UserProfile).limit(1))
    profile = result.scalar_one_or_none()
    if profile is None:
        profile = UserProfile()
        session.add(profile)
        await session.commit()
        await session.refresh(profile)
    return profile


async def update_profile(session: AsyncSession, data: dict) -> UserProfile:
    profile = await get_or_create_profile(session)
    for key, value in data.items():
        setattr(profile, key, value)
    profile.updated_at = datetime.now(timezone.utc)
    await session.commit()
    await session.refresh(profile)
    return profile
