from __future__ import annotations
import os
from collections.abc import AsyncGenerator
from urllib.parse import urlparse, urlencode, parse_qs, urlunparse
from fastapi import Depends
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

_raw_url = os.environ["DATABASE_URL"]
_asyncpg_url = _raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# asyncpg doesn't accept sslmode/channel_binding as URL params — strip them
_parsed = urlparse(_asyncpg_url)
_params = {k: v for k, v in parse_qs(_parsed.query).items()
           if k not in ("sslmode", "channel_binding")}
_clean_query = urlencode({k: v[0] for k, v in _params.items()})
_url = urlunparse(_parsed._replace(query=_clean_query))

engine = create_async_engine(_url, pool_size=5, max_overflow=0, echo=False,
                             connect_args={"ssl": True})
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session


async def get_user_db(session: AsyncSession = Depends(get_session)):
    from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase
    from db.models import User, OAuthAccount
    yield SQLAlchemyUserDatabase(session, User, OAuthAccount)
