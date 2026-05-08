from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel


class SkillCreate(BaseModel):
    category: str
    items: list[str]


class SkillUpdate(BaseModel):
    category: str | None = None
    items: list[str] | None = None


class SkillRead(SkillCreate):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


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
    content_json: str
    initial_match_score: float | None = None
    match_score: float | None = None

    model_config = {"from_attributes": True}
