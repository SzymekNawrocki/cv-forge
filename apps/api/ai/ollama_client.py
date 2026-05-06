from __future__ import annotations
import json
import re
import httpx

OLLAMA_BASE = "http://localhost:11434"


async def generate(
    prompt: str,
    model: str = "llama3.2:1b",
    client: httpx.AsyncClient | None = None,
) -> str:
    own_client = client is None
    if own_client:
        client = httpx.AsyncClient(timeout=60.0)
    try:
        res = await client.post(
            f"{OLLAMA_BASE}/api/generate",
            json={"model": model, "prompt": prompt, "stream": False},
        )
        res.raise_for_status()
        return res.json()["response"].strip()
    finally:
        if own_client:
            await client.aclose()


def extract_json(raw: str) -> dict:
    cleaned = re.sub(r"```(?:json)?\s*|\s*```", "", raw).strip()
    return json.loads(cleaned)
