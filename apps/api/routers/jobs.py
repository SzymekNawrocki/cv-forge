from fastapi import APIRouter, Depends
from auth.config import current_active_verified_user
from db.models import User

router = APIRouter()


@router.get("/")
async def list_jobs(user: User = Depends(current_active_verified_user)):
    return {"jobs": []}
