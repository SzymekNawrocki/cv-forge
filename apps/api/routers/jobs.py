from __future__ import annotations

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, HttpUrl

from auth.config import current_active_verified_user
from db.models import User

router = APIRouter()


class ScrapeRequest(BaseModel):
    url: str


@router.get("/")
async def list_jobs(user: User = Depends(current_active_verified_user)):
    return {"jobs": []}


@router.post("/scrape")
async def scrape_job_url(
    body: ScrapeRequest,
    user: User = Depends(current_active_verified_user),
):
    """Fetch a job listing URL and return plain text. Handles common blocking gracefully."""
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=12) as client:
            resp = await client.get(
                body.url,
                headers={
                    "User-Agent": (
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/120.0.0.0 Safari/537.36"
                    )
                },
            )
    except Exception as exc:
        raise HTTPException(422, f"Could not reach URL: {exc}")

    if resp.status_code in (403, 429):
        return {
            "error": "blocked",
            "message": "This site blocks automated access. Please paste the job description text manually.",
        }

    if not resp.is_success:
        return {
            "error": "blocked",
            "message": f"Site returned {resp.status_code}. Please paste the job description text manually.",
        }

    html = resp.text
    try:
        from readability import Document as ReadDoc  # type: ignore[import]
        doc = ReadDoc(html)
        summary_html = doc.summary()
        title = doc.title()

        # Strip HTML tags to get plain text
        import re
        plain = re.sub(r"<[^>]+>", " ", summary_html)
        plain = re.sub(r"&nbsp;", " ", plain)
        plain = re.sub(r"&amp;", "&", plain)
        plain = re.sub(r"&lt;", "<", plain)
        plain = re.sub(r"&gt;", ">", plain)
        plain = re.sub(r"\s{2,}", "\n", plain).strip()
    except ImportError:
        # Fallback: strip all tags from raw HTML
        import re
        plain = re.sub(r"<[^>]+>", " ", html)
        plain = re.sub(r"\s{2,}", "\n", plain).strip()
        title = ""

    if len(plain) < 100:
        return {
            "error": "blocked",
            "message": "Could not extract enough text. Please paste the job description manually.",
        }

    return {"text": plain[:15000], "title": title}
