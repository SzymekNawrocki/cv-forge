from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, Field


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


class MasterCVRead(BaseModel):
    id: int
    title: str
    content_markdown: str
    github_url: str | None = None
    portfolio_url: str | None = None
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


class UserProfileUpdate(BaseModel):
    name: str | None = None
    job_title: str | None = None
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    github_url: str | None = None
    portfolio_url: str | None = None


class UserProfileRead(UserProfileUpdate):
    id: int
    updated_at: datetime

    model_config = {"from_attributes": True}


class CVLinksUpdate(BaseModel):
    github_url: str | None = None
    portfolio_url: str | None = None


class SkillCategoryEntry(BaseModel):
    category: str
    items: list[str]


class WorkExperienceEntry(BaseModel):
    company: str
    role: str
    date_range: str
    bullets: list[str] = []


class ProjectEntry(BaseModel):
    name: str
    description: str
    url: str = ""
    date_range: str = ""


class EducationEntry(BaseModel):
    institution: str
    degree: str
    years: str


class LanguageEntry(BaseModel):
    language: str
    level: str


class CertificationEntry(BaseModel):
    name: str
    url: str = ""
    year: str = ""


class CVFormData(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    github_url: str = Field(default="", max_length=500)
    portfolio_url: str = Field(default="", max_length=500)
    name: str = Field(min_length=1, max_length=255)
    job_title: str = Field(min_length=1, max_length=255)
    email: str = Field(default="", max_length=255)
    phone: str = Field(default="", max_length=50)
    location: str = Field(default="", max_length=255)
    about_me: str = Field(default="", max_length=5_000)
    skills: list[SkillCategoryEntry] = []
    projects: list[ProjectEntry] = []
    work_experience: list[WorkExperienceEntry] = []
    education: list[EducationEntry] = []
    languages: list[LanguageEntry] = []
    certifications: list[CertificationEntry] = []
