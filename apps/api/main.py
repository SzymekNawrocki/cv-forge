import logging
import os
import sys
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

_REQUIRED_VARS = ("DATABASE_URL", "GEMINI_API_KEY")
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
from db.models import Base
from rate_limit import limiter
from routers import jobs, cv, skills, profile

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
_API_SECRET = os.environ.get("API_SECRET_KEY", "").strip()

_AUTH_SKIP_PATHS = {"/health", "/docs", "/openapi.json", "/redoc"}


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(text(
            "ALTER TABLE master_cvs ADD COLUMN IF NOT EXISTS github_url VARCHAR(500)"
        ))
        await conn.execute(text(
            "ALTER TABLE master_cvs ADD COLUMN IF NOT EXISTS portfolio_url VARCHAR(500)"
        ))
    logger.info("API Ready - Database Connected")
    yield


app = FastAPI(title="CV Forge API", version="0.1.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    if _API_SECRET and request.method != "OPTIONS" and request.url.path not in _AUTH_SKIP_PATHS:
        auth = request.headers.get("Authorization", "")
        if auth != f"Bearer {_API_SECRET}":
            return JSONResponse(
                status_code=401,
                content={"detail": "Unauthorized"},
                headers={"WWW-Authenticate": "Bearer"},
            )
    return await call_next(request)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


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
