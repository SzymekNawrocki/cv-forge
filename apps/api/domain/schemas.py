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
    title: str
    github_url: str = ""
    portfolio_url: str = ""
    name: str
    job_title: str
    email: str = ""
    phone: str = ""
    location: str = ""
    about_me: str = ""
    skills: list[SkillCategoryEntry] = []
    projects: list[ProjectEntry] = []
    work_experience: list[WorkExperienceEntry] = []
    education: list[EducationEntry] = []
    languages: list[LanguageEntry] = []
    certifications: list[CertificationEntry] = []
