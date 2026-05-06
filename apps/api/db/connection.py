from __future__ import annotations
import json
import aiosqlite
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "job_hunter.db"
_SCHEMA = Path(__file__).parent / "schema.sql"


async def get_db() -> aiosqlite.Connection:
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    return db


async def init_db() -> None:
    schema = _SCHEMA.read_text()
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript(schema)
        await db.commit()


async def insert_job(db: aiosqlite.Connection, job: dict) -> int:
    tech_stack_json = json.dumps(job.get("tech_stack", []))
    async with db.execute("BEGIN IMMEDIATE"):
        pass
    cur = await db.execute(
        """INSERT INTO jobs (title, company, tech_stack, salary_min, salary_max,
           currency, contact_email, source_url, raw_text)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            job.get("title"),
            job.get("company"),
            tech_stack_json,
            job.get("salary_min"),
            job.get("salary_max"),
            job.get("currency"),
            job.get("contact_email"),
            job.get("source_url"),
            job.get("raw_text"),
        ),
    )
    await db.commit()
    return cur.lastrowid


async def list_jobs(db: aiosqlite.Connection, limit: int = 50) -> list[dict]:
    cur = await db.execute(
        "SELECT * FROM jobs ORDER BY created_at DESC LIMIT ?", (limit,)
    )
    rows = await cur.fetchall()
    return [_row_to_dict(r) for r in rows]


async def get_job(db: aiosqlite.Connection, job_id: int) -> dict | None:
    cur = await db.execute("SELECT * FROM jobs WHERE id = ?", (job_id,))
    row = await cur.fetchone()
    return _row_to_dict(row) if row else None


def _row_to_dict(row: aiosqlite.Row) -> dict:
    d = dict(row)
    d["tech_stack"] = json.loads(d.get("tech_stack") or "[]")
    return d
