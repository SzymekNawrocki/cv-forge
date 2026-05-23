from __future__ import annotations
from pydantic import BaseModel, field_validator


class JDAnalysis(BaseModel):
    job_title: str = ""
    seniority: str = ""
    keywords: list[str] = []
    required_skills: list[str] = []
    nice_to_have: list[str] = []
    role_summary: str = ""


class ForgeResult(BaseModel):
    rewritten: str = ""

    model_config = {"extra": "ignore"}


class MatchScore(BaseModel):
    score: float = 0.0
    missing_critical: list[str] = []
    missing_nice_to_have: list[str] = []
    reasoning: str = ""

    @field_validator("score")
    @classmethod
    def clamp_score(cls, v: float) -> float:
        return max(0.0, min(100.0, v))

    @field_validator("missing_critical", "missing_nice_to_have", mode="before")
    @classmethod
    def flatten_nested(cls, v: object) -> list[str]:
        if not isinstance(v, list):
            return []
        result: list[str] = []
        for item in v:
            if isinstance(item, list):
                result.extend(str(x) for x in item if x)
            elif item:
                result.append(str(item))
        return result


class CleanCVResult(BaseModel):
    markdown: str = ""


class WorkEntry(BaseModel):
    org: str = ""
    role: str = ""
    date: str = ""
    bullets: list[str] = []


class ParsedEntries(BaseModel):
    entries: list[WorkEntry] = []
