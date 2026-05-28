import logging
import os
import sys
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

_REQUIRED_VARS = (
    "DATABASE_URL",
    "OPENROUTER_API_KEY",
    "JWT_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "RESEND_API_KEY",
)
_missing = [v for v in _REQUIRED_VARS if not os.environ.get(v)]
if _missing:
    sys.exit(f"Missing required environment variables: {', '.join(_missing)}")

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from sqlalchemy import text
from db.base import engine
import db.models  # noqa: F401 — registers all models
from db.models import Base
from rate_limit import limiter
from routers import jobs, cv, skills, profile
from auth.config import fastapi_users, auth_backend, google_oauth_client
from auth.schemas import UserRead, UserCreate, UserUpdate

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

_ALLOWED_ORIGINS = [
    o.strip()
    for o in os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if o.strip()
]


class PrivateNetworkMiddleware:
    """Adds Access-Control-Allow-Private-Network: true to preflight responses.

    Chrome 98+ sends Access-Control-Request-Private-Network on cross-port
    localhost requests. Starlette's CORSMiddleware doesn't support this header
    in the installed version, so we handle it in a thin outer ASGI wrapper.
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = dict(scope.get("headers", []))
        needs_pna = headers.get(b"access-control-request-private-network") == b"true"

        if not needs_pna:
            await self.app(scope, receive, send)
            return

        async def send_with_pna(message):
            if message["type"] == "http.response.start":
                message = {
                    **message,
                    "headers": list(message.get("headers", []))
                    + [(b"access-control-allow-private-network", b"true")],
                }
            await send(message)

        await self.app(scope, receive, send_with_pna)


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Idempotent schema migrations for columns added after initial deploy
        await conn.execute(text(
            "ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS preferred_model VARCHAR(100)"
        ))
        await conn.execute(text(
            "ALTER TABLE tailored_cvs DROP COLUMN IF EXISTS gaps_json"
        ))
    logger.info("API Ready - Database Connected")
    yield


class _CatchAllMiddleware:
    """Converts any unhandled exception to a 500 JSON response.

    Must be added before CORSMiddleware so it sits inside the CORS scope —
    that way the 500 response travels back through CORSMiddleware's wrapped
    send and receives Access-Control-Allow-Origin headers. Without this,
    exceptions bubble past CORSMiddleware before any headers are written and
    the browser sees a CORS error instead of a 500.
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        try:
            await self.app(scope, receive, send)
        except Exception as exc:
            logger.exception("Unhandled error")
            response = JSONResponse(
                status_code=500,
                content={"detail": "Internal server error"},
            )
            await response(scope, receive, send)


app = FastAPI(title="CV Forge API", version="0.1.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Middleware order: last add_middleware = outermost (runs first).
# _CatchAllMiddleware must be added first so it ends up innermost —
# inside CORSMiddleware — so its 500 responses get CORS headers.
app.add_middleware(_CatchAllMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)
app.add_middleware(PrivateNetworkMiddleware)


_frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")

app.include_router(fastapi_users.get_auth_router(auth_backend), prefix="/auth/jwt", tags=["auth"])
app.include_router(fastapi_users.get_register_router(UserRead, UserCreate), prefix="/auth", tags=["auth"])
app.include_router(fastapi_users.get_verify_router(UserRead), prefix="/auth", tags=["auth"])
app.include_router(fastapi_users.get_users_router(UserRead, UserUpdate), prefix="/users", tags=["users"])
app.include_router(
    fastapi_users.get_oauth_router(
        google_oauth_client,
        auth_backend,
        os.environ["JWT_SECRET"],
        redirect_url=f"{_frontend_url}/",
        is_verified_by_default=True,
    ),
    prefix="/auth/google",
    tags=["auth"],
)

app.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
app.include_router(cv.router, prefix="/cv", tags=["cv"])
app.include_router(skills.router, prefix="/skills", tags=["skills"])
app.include_router(profile.router, prefix="/profile", tags=["profile"])


@app.get("/health")
async def health():
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return {"status": "ok", "db": "ok"}
    except Exception:
        logger.exception("Health check DB ping failed")
        return JSONResponse(status_code=503, content={"status": "degraded", "db": "unreachable"})
