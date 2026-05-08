import asyncio
import sys
from dotenv import load_dotenv

load_dotenv()

from sqlalchemy import text
from db.base import engine
from db.models import Base


async def main():
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            await conn.execute(text(
                "ALTER TABLE master_cvs ADD COLUMN IF NOT EXISTS github_url VARCHAR(500)"
            ))
            await conn.execute(text(
                "ALTER TABLE master_cvs ADD COLUMN IF NOT EXISTS portfolio_url VARCHAR(500)"
            ))
        print("DB schema ready")
        await engine.dispose()
    except Exception as e:
        print(f"DB init failed: {e}", file=sys.stderr)
        sys.exit(1)


asyncio.run(main())
