import asyncio
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

import sentry_sdk
import structlog

if _sentry_dsn := os.environ.get("SENTRY_DSN"):
    sentry_sdk.init(
        dsn=_sentry_dsn,
        traces_sample_rate=0.1,
        environment=os.environ.get("ENVIRONMENT", "development"),
    )

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.BoundLogger,
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
)
log = structlog.get_logger()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from sqlalchemy import text
from db.base import engine
from rate_limit import limiter
from routers import jobs, cv, skills, profile, me, export, demo
from auth.config import fastapi_users, auth_backend, google_oauth_client
from auth.schemas import UserRead, UserCreate, UserUpdate

_ALLOWED_ORIGINS = [
    o.strip()
    for o in os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if o.strip()
]


class PrivateNetworkMiddleware:
    """Adds Access-Control-Allow-Private-Network: true to preflight responses."""

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


async def _cleanup_forge_jobs(app: FastAPI):
    """Periodically remove completed/failed forge job entries to prevent memory growth."""
    while True:
        await asyncio.sleep(300)
        to_delete = [
            jid for jid, job in list(app.state.forge_jobs.items())
            if job.get("status") in ("done", "failed")
        ]
        for jid in to_delete:
            app.state.forge_jobs.pop(jid, None)


async def _cleanup_demo_users():
    """Periodically delete demo users older than 4 hours; CASCADE removes their data."""
    from sqlalchemy import text as _text
    while True:
        await asyncio.sleep(1800)
        try:
            from db.base import SessionLocal as _SessionLocal
            async with _SessionLocal() as session:
                await session.execute(_text(
                    'DELETE FROM "user" WHERE is_demo AND created_at < now() - interval \'4 hours\''
                ))
                await session.commit()
        except Exception:
            log.exception("demo_gc_failed")


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.forge_jobs: dict = {}
    asyncio.create_task(_cleanup_forge_jobs(app))
    asyncio.create_task(_cleanup_demo_users())
    log.info("api_ready", db="ok")
    yield


class _CatchAllMiddleware:
    """Converts any unhandled exception to a 500 JSON response inside the CORS scope."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        try:
            await self.app(scope, receive, send)
        except Exception:
            log.exception("unhandled_error")
            response = JSONResponse(
                status_code=500,
                content={"detail": "Internal server error"},
            )
            await response(scope, receive, send)


app = FastAPI(title="CV Forge API", version="0.1.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Middleware order: last add_middleware = outermost (runs first).
# _CatchAllMiddleware must be innermost — inside CORSMiddleware — so its 500s get CORS headers.
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
app.include_router(demo.router, prefix="/auth", tags=["auth"])
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
app.include_router(me.router, prefix="/me", tags=["me"])
app.include_router(export.router, prefix="/cv", tags=["export"])


@app.get("/health")
async def health():
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return {"status": "ok", "db": "ok"}
    except Exception:
        log.exception("health_db_failed")
        return JSONResponse(status_code=503, content={"status": "degraded", "db": "unreachable"})


@app.get("/health/ai")
async def health_ai():
    from ai.client import OllamaClient
    try:
        client = OllamaClient()
        result = await client.ping()
        return {"status": "ok", "model": result}
    except Exception as exc:
        log.warning("health_ai_failed", error=str(exc))
        return JSONResponse(status_code=503, content={"status": "degraded", "error": str(exc)})
