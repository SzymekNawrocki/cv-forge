from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ai.client import OllamaClient
from ai.prompts import ForgeStrategy
from auth.config import current_active_verified_user, current_user_with_sentry
from db.base import get_session
from db.models import MasterCV, TailoredCV, User
from domain.schemas import CVFormData, MasterCVRead, TailoredCVListItem, TailoredCVRead
from rate_limit import limiter
from services.forge_service import (
    CVNotFoundError,
    import_cv,
    create_cv_from_form,
    run_forge,
    list_master_cvs,
    update_master_cv_links,
)

import structlog
log = structlog.get_logger()

router = APIRouter()


class ImportRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    raw_text: str = Field(min_length=1, max_length=50_000)
    github_url: str | None = Field(None, max_length=500)
    portfolio_url: str | None = Field(None, max_length=500)


class ForgeRequest(BaseModel):
    master_cv_id: int
    job_description_text: str = Field(min_length=1, max_length=20_000)
    strategy: ForgeStrategy = ForgeStrategy.ANCHORED


class CVLinksRequest(BaseModel):
    github_url: str | None = Field(None, max_length=500)
    portfolio_url: str | None = Field(None, max_length=500)


def _ollama() -> OllamaClient:
    return OllamaClient()


async def _run_forge_bg(
    app,
    job_id: str,
    body: ForgeRequest,
    user_id: uuid.UUID,
) -> None:
    """Background task: run forge and store result in app.state.forge_jobs."""
    from db.base import SessionLocal
    app.state.forge_jobs[job_id].update({"status": "running", "progress": 0.05})
    try:
        async with SessionLocal() as session:
            tailored, failed_sections = await run_forge(
                body.master_cv_id, body.job_description_text, session,
                user_id=user_id, strategy=body.strategy,
            )
            result = TailoredCVRead(
                id=tailored.id,
                master_cv_id=tailored.master_cv_id,
                job_desc_id=tailored.job_desc_id,
                content_json=tailored.content_json,
                initial_match_score=tailored.initial_match_score,
                match_score=tailored.match_score,
                failed_sections=failed_sections,
                strategy=tailored.strategy,
            ).model_dump()
            app.state.forge_jobs[job_id].update({
                "status": "done",
                "progress": 1.0,
                "result": result,
            })
    except CVNotFoundError as exc:
        app.state.forge_jobs[job_id].update({
            "status": "failed",
            "error": str(exc),
            "error_status": 404,
        })
    except Exception as exc:
        log.exception("forge_bg_failed", job_id=job_id)
        app.state.forge_jobs[job_id].update({
            "status": "failed",
            "error": str(exc),
            "error_status": 500,
        })


@router.post("/import", response_model=MasterCVRead)
@limiter.limit("5/minute")
async def cv_import(
    request: Request,
    body: ImportRequest,
    session: AsyncSession = Depends(get_session),
    ollama: OllamaClient = Depends(_ollama),
    user: User = Depends(current_active_verified_user),
):
    return await import_cv(
        body.raw_text, body.title, ollama, session,
        user_id=user.id,
        github_url=body.github_url,
        portfolio_url=body.portfolio_url,
    )


@router.post("/create", response_model=MasterCVRead)
async def cv_create(
    body: CVFormData,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(current_active_verified_user),
):
    return await create_cv_from_form(body, session, user_id=user.id)


@router.get("/", response_model=list[MasterCVRead])
async def list_cvs(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(current_active_verified_user),
):
    return await list_master_cvs(session, user_id=user.id)


@router.post("/forge", status_code=202)
async def forge(
    request: Request,
    body: ForgeRequest,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(current_user_with_sentry),
):
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    daily_count = await session.scalar(
        select(func.count())
        .select_from(TailoredCV)
        .join(MasterCV, TailoredCV.master_cv_id == MasterCV.id)
        .where(MasterCV.user_id == user.id, TailoredCV.created_at >= cutoff)
    )
    if daily_count >= 20:
        raise HTTPException(
            status_code=429,
            headers={"Retry-After": "3600"},
            detail="Daily forge limit reached (20/day). Try again tomorrow.",
        )

    job_id = str(uuid.uuid4())
    request.app.state.forge_jobs[job_id] = {
        "status": "queued",
        "progress": 0.0,
        "result": None,
        "error": None,
        "error_status": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    asyncio.create_task(_run_forge_bg(request.app, job_id, body, user.id))
    return {"job_id": job_id}


@router.get("/jobs/{job_id}")
async def poll_forge_job(
    job_id: str,
    request: Request,
    user: User = Depends(current_active_verified_user),
):
    job = request.app.state.forge_jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found or expired")
    return job


@router.get("/{cv_id}/tailored", response_model=list[TailoredCVListItem])
async def list_tailored(
    cv_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(current_active_verified_user),
):
    cv = await session.get(MasterCV, cv_id)
    if not cv or cv.user_id != user.id:
        raise HTTPException(404, "CV not found")

    result = await session.execute(
        select(TailoredCV)
        .where(TailoredCV.master_cv_id == cv_id)
        .order_by(TailoredCV.created_at.desc())
    )
    return list(result.scalars().all())


@router.get("/{cv_id}", response_model=MasterCVRead)
async def get_cv(
    cv_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(current_active_verified_user),
):
    cv = await session.get(MasterCV, cv_id)
    if not cv or cv.user_id != user.id:
        raise HTTPException(404, "CV not found")
    return cv


@router.put("/{cv_id}/links", response_model=MasterCVRead)
async def update_cv_links(
    cv_id: int,
    body: CVLinksRequest,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(current_active_verified_user),
):
    try:
        return await update_master_cv_links(cv_id, body.github_url, body.portfolio_url, session, user_id=user.id)
    except ValueError as e:
        raise HTTPException(404, str(e))


@router.delete("/{cv_id}", status_code=204)
async def delete_cv(
    cv_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(current_active_verified_user),
):
    cv = await session.get(MasterCV, cv_id)
    if not cv or cv.user_id != user.id:
        raise HTTPException(404, "CV not found")
    await session.delete(cv)
    await session.commit()
