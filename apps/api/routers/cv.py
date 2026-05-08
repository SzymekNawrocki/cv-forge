from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ai.client import OllamaClient
from db.base import get_session
from db.models import MasterCV
from domain.schemas import CVFormData, MasterCVRead, TailoredCVRead
from services.forge_service import import_cv, create_cv_from_form, run_forge

router = APIRouter()


class ImportRequest(BaseModel):
    title: str
    raw_text: str
    github_url: str | None = None
    portfolio_url: str | None = None


class ForgeRequest(BaseModel):
    master_cv_id: int
    job_description_text: str


class CVLinksRequest(BaseModel):
    github_url: str | None = None
    portfolio_url: str | None = None


def _ollama() -> OllamaClient:
    return OllamaClient()


@router.post("/import", response_model=MasterCVRead)
async def cv_import(
    body: ImportRequest,
    session: AsyncSession = Depends(get_session),
    ollama: OllamaClient = Depends(_ollama),
):
    return await import_cv(
        body.raw_text, body.title, ollama, session,
        github_url=body.github_url,
        portfolio_url=body.portfolio_url,
    )


@router.post("/create", response_model=MasterCVRead)
async def cv_create(
    body: CVFormData,
    session: AsyncSession = Depends(get_session),
):
    return await create_cv_from_form(body, session)


@router.get("/", response_model=list[MasterCVRead])
async def list_cvs(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(MasterCV).order_by(MasterCV.created_at.desc()))
    return result.scalars().all()


@router.post("/forge", response_model=TailoredCVRead)
async def forge(
    body: ForgeRequest,
    session: AsyncSession = Depends(get_session),
    ollama: OllamaClient = Depends(_ollama),
):
    try:
        return await run_forge(body.master_cv_id, body.job_description_text, ollama, session)
    except ValueError as e:
        raise HTTPException(404, str(e))
    except Exception as e:
        raise HTTPException(500, str(e) or repr(e))


@router.get("/{cv_id}", response_model=MasterCVRead)
async def get_cv(cv_id: int, session: AsyncSession = Depends(get_session)):
    cv = await session.get(MasterCV, cv_id)
    if not cv:
        raise HTTPException(404, "CV not found")
    return cv


@router.put("/{cv_id}/links", response_model=MasterCVRead)
async def update_cv_links(
    cv_id: int,
    body: CVLinksRequest,
    session: AsyncSession = Depends(get_session),
):
    cv = await session.get(MasterCV, cv_id)
    if not cv:
        raise HTTPException(404, "CV not found")
    cv.github_url = body.github_url
    cv.portfolio_url = body.portfolio_url
    await session.commit()
    await session.refresh(cv)
    return cv


@router.delete("/{cv_id}", status_code=204)
async def delete_cv(cv_id: int, session: AsyncSession = Depends(get_session)):
    cv = await session.get(MasterCV, cv_id)
    if not cv:
        raise HTTPException(404, "CV not found")
    await session.delete(cv)
    await session.commit()
