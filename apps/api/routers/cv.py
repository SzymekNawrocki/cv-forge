from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from ai.client import OllamaClient
from auth.config import current_active_verified_user
from db.base import get_session
from db.models import MasterCV, User
from domain.schemas import CVFormData, MasterCVRead, TailoredCVRead
from rate_limit import limiter
from services.forge_service import (
    CVNotFoundError,
    import_cv,
    create_cv_from_form,
    run_forge,
    list_master_cvs,
    update_master_cv_links,
)

router = APIRouter()


class ImportRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    raw_text: str = Field(min_length=1, max_length=50_000)
    github_url: str | None = Field(None, max_length=500)
    portfolio_url: str | None = Field(None, max_length=500)


class ForgeRequest(BaseModel):
    master_cv_id: int
    job_description_text: str = Field(min_length=1, max_length=20_000)


class CVLinksRequest(BaseModel):
    github_url: str | None = Field(None, max_length=500)
    portfolio_url: str | None = Field(None, max_length=500)


def _ollama() -> OllamaClient:
    return OllamaClient()


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


@router.post("/forge", response_model=TailoredCVRead)
@limiter.limit("5/minute")
async def forge(
    request: Request,
    body: ForgeRequest,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(current_active_verified_user),
):
    try:
        result = await run_forge(body.master_cv_id, body.job_description_text, session, user_id=user.id)
        return TailoredCVRead.from_orm_with_gaps(result)
    except CVNotFoundError as e:
        raise HTTPException(404, str(e))


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
