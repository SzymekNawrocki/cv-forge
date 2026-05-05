from fastapi import APIRouter
import httpx
from pydantic import BaseModel

router = APIRouter()

OLLAMA_URL = "http://localhost:11434"

class SearchQuery(BaseModel):
    query: str
    sources: list[str] = ["pracuj", "nofluffjobs"]

@router.post("/")
async def search_jobs(body: SearchQuery):
    # 1. Scrape job listings
    raw_results = await scrape_jobs(body.query, body.sources)
    
    # 2. Ask Ollama to analyze & rank
    analysis = await analyze_with_ollama(raw_results, body.query)
    
    return {"results": raw_results, "analysis": analysis}

async def analyze_with_ollama(jobs: list, query: str) -> str:
    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": "llama3",
                "prompt": f"""Analyze these job listings for: "{query}"
                
Jobs: {jobs[:5]}  

Rank them by relevance, highlight key skills required, and identify the best recruiters to contact.
Respond in Polish.""",
                "stream": False,
            }
        )
        return response.json()["response"]

async def scrape_jobs(query: str, sources: list) -> list:
    # Placeholder — rozbudujemy w Claude Code
    return []