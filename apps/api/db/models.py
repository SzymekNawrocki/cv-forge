from __future__ import annotations
import uuid
from datetime import datetime, timezone
from sqlalchemy import UUID, Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from fastapi_users.db import SQLAlchemyBaseUserTableUUID, SQLAlchemyBaseOAuthAccountTableUUID
from db.base import Base


class OAuthAccount(SQLAlchemyBaseOAuthAccountTableUUID, Base):
    pass


class User(SQLAlchemyBaseUserTableUUID, Base):
    oauth_accounts: Mapped[list[OAuthAccount]] = relationship("OAuthAccount", lazy="joined")


class UserProfile(Base):
    __tablename__ = "user_profile"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("user.id"), unique=True, nullable=False)
    name: Mapped[str | None] = mapped_column(String(255))
    job_title: Mapped[str | None] = mapped_column(String(255))
    email: Mapped[str | None] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(50))
    location: Mapped[str | None] = mapped_column(String(255))
    github_url: Mapped[str | None] = mapped_column(String(500))
    portfolio_url: Mapped[str | None] = mapped_column(String(500))
    preferred_model: Mapped[str | None] = mapped_column(String(100))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )


class MasterCV(Base):
    __tablename__ = "master_cvs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content_markdown: Mapped[str] = mapped_column(Text, nullable=False)
    github_url: Mapped[str | None] = mapped_column(String(500))
    portfolio_url: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    tailored_cvs: Mapped[list[TailoredCV]] = relationship(back_populates="master_cv", cascade="all, delete-orphan")


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)
    category: Mapped[str] = mapped_column(String(255), nullable=False)
    items: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )


class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)
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


class AICallLog(Base):
    __tablename__ = "ai_call_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user.id", ondelete="SET NULL"), nullable=True
    )
    model: Mapped[str] = mapped_column(String(100))
    prompt_tokens: Mapped[int | None] = mapped_column(Integer)
    completion_tokens: Mapped[int | None] = mapped_column(Integer)
    latency_ms: Mapped[int | None] = mapped_column(Integer)
    success: Mapped[bool] = mapped_column(Boolean, default=True)
    error_type: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
