import asyncio
import sys
from dotenv import load_dotenv

load_dotenv()

from db.base import engine
from db.models import Base


async def main():
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("DB schema ready")
        await engine.dispose()
    except Exception as e:
        print(f"DB init failed: {e}", file=sys.stderr)
        sys.exit(1)


asyncio.run(main())
