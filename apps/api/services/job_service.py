from __future__ import annotations
import asyncio
import aiosqlite
import httpx
from domain.parsers.job_parser import parse_job_text
from db.connection import insert_job, list_jobs, get_job


async def process_raw_text(
    text: str, source_url: str | None, db: aiosqlite.Connection
) -> dict:
    job = parse_job_text(text)
    job_dict = job.model_dump()
    job_dict["source_url"] = source_url
    job_id = await insert_job(db, job_dict)
    job_dict["id"] = job_id
    return job_dict


async def fetch_all_jobs(db: aiosqlite.Connection, limit: int = 50) -> list[dict]:
    return await list_jobs(db, limit=limit)


async def fetch_job(db: aiosqlite.Connection, job_id: int) -> dict | None:
    return await get_job(db, job_id)
