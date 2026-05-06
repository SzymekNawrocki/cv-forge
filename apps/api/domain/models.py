from __future__ import annotations
from pydantic import BaseModel
from typing import Optional


class Job(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    tech_stack: list[str] = []
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    currency: Optional[str] = None
    contact_email: Optional[str] = None
    source_url: Optional[str] = None
    raw_text: Optional[str] = None


class JobRecord(Job):
    id: int
    created_at: str
    status: str = "new"
