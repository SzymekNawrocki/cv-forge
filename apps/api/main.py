from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import jobs, recruiters, search

app = FastAPI(title="Job Hunter API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs.router, prefix="/jobs")
app.include_router(recruiters.router, prefix="/recruiters")
app.include_router(search.router, prefix="/search")

@app.get("/health")
async def health():
    return {"status": "ok"}