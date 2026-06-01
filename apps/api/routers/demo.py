from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.encoders import jsonable_encoder
from sqlalchemy.ext.asyncio import AsyncSession

from auth.config import auth_backend, cookie_transport, get_jwt_strategy
from auth.manager import get_user_manager
from auth.schemas import UserRead
from db.base import get_session
from rate_limit import limiter
from services.demo_service import DEMO_ENABLED, create_demo_user, seed_demo_user

router = APIRouter()


@router.post("/demo", response_model=UserRead)
@limiter.limit("5/hour")
async def demo_login(
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_session),
    user_manager=Depends(get_user_manager),
):
    if not DEMO_ENABLED:
        raise HTTPException(404, "Demo mode is not enabled")

    user = await create_demo_user(user_manager, session)
    await seed_demo_user(session, user.id)

    strategy = get_jwt_strategy()
    token = await strategy.write_token(user)
    response.set_cookie(
        key=cookie_transport.cookie_name,
        value=token,
        max_age=cookie_transport.cookie_max_age,
        httponly=cookie_transport.cookie_httponly,
        secure=cookie_transport.cookie_secure,
        samesite=cookie_transport.cookie_samesite,
    )
    return UserRead.model_validate(user)
