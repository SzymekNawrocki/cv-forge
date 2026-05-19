import asyncio
import sys
from dotenv import load_dotenv

load_dotenv()

from sqlalchemy import text
from db.base import engine
import db.models  # noqa: F401 — registers all models in metadata
from db.models import Base


async def main():
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            await conn.execute(text(
                "ALTER TABLE tailored_cvs ADD COLUMN IF NOT EXISTS gaps_json TEXT"
            ))
        print("DB schema ready")
        await engine.dispose()
    except Exception as e:
        print(f"DB init failed: {e}", file=sys.stderr)
        sys.exit(1)


asyncio.run(main())
