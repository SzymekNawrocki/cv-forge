import asyncio
import os
import sys
from logging.config import fileConfig
from urllib.parse import urlparse, urlencode, parse_qs, urlunparse

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import pool
from alembic import context

# Make sure the api package root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import db.models  # noqa: F401 — registers all models with Base
from db.base import Base

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def _get_url() -> str:
    raw = os.environ["DATABASE_URL"]
    url = raw.replace("postgresql://", "postgresql+asyncpg://", 1)
    parsed = urlparse(url)
    params = {k: v for k, v in parse_qs(parsed.query).items()
              if k not in ("sslmode", "channel_binding")}
    clean = urlencode({k: v[0] for k, v in params.items()})
    return urlunparse(parsed._replace(query=clean))


def run_migrations_offline() -> None:
    context.configure(
        url=_get_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def _do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def _run_async_migrations() -> None:
    engine = create_async_engine(
        _get_url(),
        poolclass=pool.NullPool,
        connect_args={"ssl": True},
    )
    async with engine.connect() as conn:
        await conn.run_sync(_do_run_migrations)
    await engine.dispose()


def run_migrations_online() -> None:
    asyncio.run(_run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
