from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel


class MasterCVCreate(BaseModel):
    title: str
    content_markdown: str


class MasterCVRead(MasterCVCreate):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class JobDescriptionCreate(BaseModel):
    raw_text: str
    company_name: str | None = None


class JobDescriptionRead(JobDescriptionCreate):
    id: int
    extracted_keywords: str | None = None

    model_config = {"from_attributes": True}


class TailoredCVRead(BaseModel):
    id: int
    master_cv_id: int
    job_desc_id: int
    content_markdown: str
    match_score: float | None = None

    model_config = {"from_attributes": True}
