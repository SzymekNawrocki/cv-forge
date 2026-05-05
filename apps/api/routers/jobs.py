from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_jobs():
    return {"jobs": []}

@router.get("/{job_id}")
async def get_job(job_id: int):
    return {"job_id": job_id}