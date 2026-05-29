"""GDPR endpoints: data export (ZIP) and account deletion."""
from __future__ import annotations

import io
import json
import zipfile
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from auth.config import current_active_verified_user
from auth.manager import get_user_manager
from db.base import get_session
from db.models import AICallLog, JobDescription, MasterCV, Skill, TailoredCV, User, UserProfile

router = APIRouter()


@router.get("/data")
async def export_my_data(
    user: User = Depends(current_active_verified_user),
    session: AsyncSession = Depends(get_session),
):
    """Download all user data as a ZIP archive with one JSON file per table."""
    profile = (await session.execute(select(UserProfile).where(UserProfile.user_id == user.id))).scalar_one_or_none()
    cvs = list((await session.execute(select(MasterCV).where(MasterCV.user_id == user.id))).scalars())
    skills = list((await session.execute(select(Skill).where(Skill.user_id == user.id))).scalars())
    jds = list((await session.execute(select(JobDescription).where(JobDescription.user_id == user.id))).scalars())

    cv_ids = [cv.id for cv in cvs]
    tailored = []
    if cv_ids:
        tailored = list((await session.execute(
            select(TailoredCV).where(TailoredCV.master_cv_id.in_(cv_ids))
        )).scalars())

    logs = list((await session.execute(
        select(AICallLog).where(AICallLog.user_id == user.id).order_by(AICallLog.created_at.desc()).limit(1000)
    )).scalars())

    def _dt(v: datetime | None) -> str | None:
        return v.isoformat() if v else None

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("profile.json", json.dumps({
            "id": profile.id if profile else None,
            "name": profile.name if profile else None,
            "job_title": profile.job_title if profile else None,
            "email": profile.email if profile else None,
            "phone": profile.phone if profile else None,
            "location": profile.location if profile else None,
            "github_url": profile.github_url if profile else None,
            "portfolio_url": profile.portfolio_url if profile else None,
            "updated_at": _dt(profile.updated_at) if profile else None,
        }, indent=2))

        zf.writestr("cvs.json", json.dumps([{
            "id": cv.id,
            "title": cv.title,
            "content_markdown": cv.content_markdown,
            "github_url": cv.github_url,
            "portfolio_url": cv.portfolio_url,
            "created_at": _dt(cv.created_at),
        } for cv in cvs], indent=2))

        zf.writestr("skills.json", json.dumps([{
            "id": s.id,
            "category": s.category,
            "items": s.items,
            "created_at": _dt(s.created_at),
        } for s in skills], indent=2))

        zf.writestr("job_descriptions.json", json.dumps([{
            "id": jd.id,
            "raw_text": jd.raw_text,
            "company_name": jd.company_name,
            "extracted_keywords": jd.extracted_keywords,
        } for jd in jds], indent=2))

        zf.writestr("tailored_cvs.json", json.dumps([{
            "id": t.id,
            "master_cv_id": t.master_cv_id,
            "job_desc_id": t.job_desc_id,
            "initial_match_score": t.initial_match_score,
            "match_score": t.match_score,
            "strategy": t.strategy,
            "content_json": t.content_json,
            "created_at": _dt(t.created_at),
        } for t in tailored], indent=2))

        zf.writestr("ai_call_logs.json", json.dumps([{
            "id": log.id,
            "model": log.model,
            "prompt_tokens": log.prompt_tokens,
            "completion_tokens": log.completion_tokens,
            "latency_ms": log.latency_ms,
            "success": log.success,
            "created_at": _dt(log.created_at),
        } for log in logs], indent=2))

    buf.seek(0)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d")
    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=cv-forge-data-{timestamp}.zip"},
    )


@router.delete("", status_code=204)
async def delete_me(
    user: User = Depends(current_active_verified_user),
    session: AsyncSession = Depends(get_session),
    user_manager=Depends(get_user_manager),
):
    """Delete all data for this user (GDPR right to erasure)."""
    # Delete in dependency order to avoid FK violations
    cv_ids_result = await session.execute(select(MasterCV.id).where(MasterCV.user_id == user.id))
    cv_ids = [row[0] for row in cv_ids_result]

    if cv_ids:
        await session.execute(delete(TailoredCV).where(TailoredCV.master_cv_id.in_(cv_ids)))

    await session.execute(delete(JobDescription).where(JobDescription.user_id == user.id))
    await session.execute(delete(MasterCV).where(MasterCV.user_id == user.id))
    await session.execute(delete(Skill).where(Skill.user_id == user.id))
    await session.execute(delete(UserProfile).where(UserProfile.user_id == user.id))
    await session.commit()

    await user_manager.delete(user, request=None)
