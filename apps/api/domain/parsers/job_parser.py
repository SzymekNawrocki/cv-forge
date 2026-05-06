from __future__ import annotations
import re
import json
import httpx
from typing import Callable
from domain.models import Job

_OLLAMA_URL = "http://localhost:11434/api/generate"
_MODEL = "llama3.2:1b"

_PROMPT_TMPL = """Extract job details from the text below. Return ONLY valid JSON matching this schema exactly:
{{"title": "string", "company": "string", "tech_stack": ["string"], "salary_min": integer_or_null, "salary_max": integer_or_null, "currency": "string_or_null", "contact_email": "string_or_null"}}
No markdown. No explanation. JSON only.

TEXT:
{text}
"""

_STRICT_PROMPT_TMPL = """You must return ONLY a JSON object. No text before or after. Use null for missing fields.
Schema: {{"title":"string","company":"string","tech_stack":["string"],"salary_min":integer_or_null,"salary_max":integer_or_null,"currency":"string_or_null","contact_email":"string_or_null"}}

TEXT:
{text}
"""


def _call_ollama(prompt: str) -> str:
    with httpx.Client(timeout=60.0) as client:
        res = client.post(
            _OLLAMA_URL,
            json={"model": _MODEL, "prompt": prompt, "stream": False},
        )
        res.raise_for_status()
        return res.json()["response"].strip()


def _extract_json(raw: str) -> dict:
    cleaned = re.sub(r"```(?:json)?\s*|\s*```", "", raw).strip()
    return json.loads(cleaned)


def parse_job_text(
    text: str,
    ai_fn: Callable[[str], str] | None = None,
) -> Job:
    if ai_fn is None:
        ai_fn = _call_ollama

    prompt = _PROMPT_TMPL.format(text=text.strip())
    raw = ai_fn(prompt)
    try:
        data = _extract_json(raw)
    except json.JSONDecodeError:
        strict_prompt = _STRICT_PROMPT_TMPL.format(text=text.strip())
        raw = ai_fn(strict_prompt)
        data = _extract_json(raw)

    return Job(
        title=data.get("title"),
        company=data.get("company"),
        tech_stack=data.get("tech_stack") or [],
        salary_min=data.get("salary_min"),
        salary_max=data.get("salary_max"),
        currency=data.get("currency"),
        contact_email=data.get("contact_email"),
        raw_text=text,
    )
