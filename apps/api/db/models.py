from __future__ import annotations
from datetime import datetime, timezone
from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from db.base import Base


class MasterCV(Base):
    __tablename__ = "master_cvs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content_markdown: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    tailored_cvs: Mapped[list[TailoredCV]] = relationship(back_populates="master_cv", cascade="all, delete-orphan")


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    category: Mapped[str] = mapped_column(String(255), nullable=False)
    items: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )


class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    extracted_keywords: Mapped[str | None] = mapped_column(Text)
    company_name: Mapped[str | None] = mapped_column(String(255))

    tailored_cvs: Mapped[list[TailoredCV]] = relationship(back_populates="job_description")


class TailoredCV(Base):
    __tablename__ = "tailored_cvs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    master_cv_id: Mapped[int] = mapped_column(ForeignKey("master_cvs.id"), nullable=False)
    job_desc_id: Mapped[int] = mapped_column(ForeignKey("job_descriptions.id"), nullable=False)
    content_json: Mapped[str] = mapped_column(Text, nullable=False)
    initial_match_score: Mapped[float | None] = mapped_column(Float)
    match_score: Mapped[float | None] = mapped_column(Float)

    master_cv: Mapped[MasterCV] = relationship(back_populates="tailored_cvs")
    job_description: Mapped[JobDescription] = relationship(back_populates="tailored_cvs")
