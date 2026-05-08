from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from db.base import engine
from db.models import Base
from routers import jobs, cv, skills, profile


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Idempotent column additions for existing master_cvs rows
        await conn.execute(text(
            "ALTER TABLE master_cvs ADD COLUMN IF NOT EXISTS github_url VARCHAR(500)"
        ))
        await conn.execute(text(
            "ALTER TABLE master_cvs ADD COLUMN IF NOT EXISTS portfolio_url VARCHAR(500)"
        ))
    print("API Ready - Database Connected")
    yield


app = FastAPI(title="CV Forge API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
app.include_router(cv.router, prefix="/cv", tags=["cv"])
app.include_router(skills.router, prefix="/skills", tags=["skills"])
app.include_router(profile.router, prefix="/profile", tags=["profile"])


@app.get("/health")
async def health():
    return {"status": "ok"}
