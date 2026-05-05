# Job Hunter — CLAUDE.md

## Project Overview

Automated tool that crawls job boards and recruiter profiles to find relevant job openings and extract structured data (tech stack, salary, contact info).

## Monorepo Structure

```
job-hunter/                  ← Turborepo root
├── apps/
│   ├── web/                 ← Next.js 16 (App Router) — dashboard UI
│   └── api/                 ← FastAPI (Python) — scraping + AI orchestration
├── packages/
│   ├── ui/                  ← Shared React components
│   ├── eslint-config/
│   └── typescript-config/
```

## Hardware Constraints — Read Before Writing Any Code

| Resource | Spec |
|----------|------|
| CPU | Intel Core i5-1135G7 (4 cores / 8 threads) |
| RAM | **8 GB strict limit** |
| GPU | None — Intel Iris Xe integrated only |

**This is not a server. Every design decision must respect these limits.**

- No in-process model loading. All AI goes through the local Ollama HTTP API (`http://localhost:11434`).
- Do **not** spin up multiple heavy processes simultaneously (no running Next.js dev + Playwright + Ollama concurrently).
- Prefer sequential logic over parallel fan-out. Async concurrency is fine; forked subprocesses and thread pools are not.
- No Docker Compose for local dev — startup overhead and RAM cost are too high.

## Approved Tech Stack

### Backend (`apps/api`)
- **Runtime:** Python 3.11+, virtual env at `apps/api/.venv`
- **Framework:** FastAPI with Uvicorn (`uvicorn main:app --reload --port 8000`)
- **HTTP client:** `httpx` (async, not `requests`)
- **HTML parsing:** `selectolax` first, `BeautifulSoup4` as fallback — no Playwright/Selenium unless the target is JavaScript-only and there is no alternative
- **Database:** SQLite via `aiosqlite` + raw SQL (no heavy ORM — SQLAlchemy Core is acceptable if needed)
- **AI:** Ollama REST API only. Allowed models: `llama3.2:1b`, `qwen2.5-coder:1.5b`, `qwen2.5-coder:3b`. Never load larger models.
- **Testing:** `pytest` + `pytest-asyncio` + `httpx` (for FastAPI test client)

### Frontend (`apps/web`)
- **Framework:** Next.js 16 with App Router (React 19)
- **Styling:** Tailwind CSS v4
- **HTTP:** native `fetch` in Server Components; `SWR` or `@tanstack/react-query` in Client Components
- **Testing:** Vitest + React Testing Library

## Development Rules

### TDD First
Write the test before the implementation for:
- All scraper/parser functions
- All FastAPI route handlers
- All data transformation utilities

Test files live next to source files: `foo.py` → `foo_test.py` (or `tests/test_foo.py`).

### Clean Architecture (Backend)
Enforce this layer separation — no cross-layer imports in the wrong direction:

```
apps/api/
├── main.py              ← FastAPI app factory + router registration only
├── routers/             ← HTTP layer: request/response, validation, status codes
├── domain/              ← Pure business logic, no FastAPI or HTTP imports
│   ├── models.py        ← Pydantic models / dataclasses
│   ├── scrapers/        ← Scraping logic (returns raw dicts)
│   └── parsers/         ← Transforms raw → structured domain objects
├── services/            ← Orchestration: calls scrapers → parsers → AI → DB
├── ai/                  ← Ollama client wrapper + prompt templates
├── db/                  ← SQLite access layer
└── tests/
```

**Rule:** `routers/` imports from `services/`. `services/` imports from `domain/` and `ai/` and `db/`. `domain/` imports nothing from the layers above it.

### Local AI Workflow
Every Ollama prompt **must**:
1. Instruct the model to return only valid JSON — no markdown, no explanation.
2. Include a concrete JSON schema example in the prompt.
3. Be wrapped in a `try/except` that catches `json.JSONDecodeError` and retries once with a stricter prompt before raising.

Example pattern:
```python
EXTRACT_PROMPT = """
Extract job details from the text below. Return ONLY valid JSON matching this schema:
{"title": "string", "company": "string", "tech_stack": ["string"], "salary_min": int|null, "salary_max": int|null, "currency": "string|null", "contact_email": "string|null"}
No markdown. No explanation. JSON only.

TEXT:
{text}
"""
```

Use the smallest model that produces acceptable results. Start with `llama3.2:1b`.

### Efficiency Rules
- Use `httpx.AsyncClient` with a shared session (lifespan context), not per-request clients.
- Rate-limit scraping with `asyncio.sleep` between requests — never hammer a domain.
- Parse HTML with `selectolax` (CSS selectors, C-backed, fast) before reaching for BeautifulSoup.
- SQLite writes: use `BEGIN IMMEDIATE` transactions to prevent WAL contention.
- Do not load entire scraped pages into memory; stream and discard HTML after parsing.

## Running the Project

```powershell
# Install all JS dependencies (root)
npm install

# Frontend dev server
npm run dev:web          # http://localhost:3000

# Backend dev server (activate venv first)
cd apps/api
.venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000

# Turbo — run both (only if RAM allows)
npm run dev
```

## Scaffold Plan (Next Steps)

### `apps/api` — needs to be created
```
apps/api/
├── main.py
├── requirements.txt       ← fastapi, uvicorn, httpx, selectolax, aiosqlite, pydantic
├── routers/
│   ├── __init__.py
│   └── jobs.py
├── domain/
│   ├── __init__.py
│   ├── models.py
│   ├── scrapers/
│   │   ├── __init__.py
│   │   └── base.py
│   └── parsers/
│       ├── __init__.py
│       └── job_parser.py
├── services/
│   ├── __init__.py
│   └── job_service.py
├── ai/
│   ├── __init__.py
│   └── ollama_client.py
├── db/
│   ├── __init__.py
│   ├── schema.sql
│   └── connection.py
└── tests/
    ├── conftest.py
    └── test_job_parser.py  ← write this first (TDD)
```

### `apps/web/src` — needs to be built out
```
apps/web/src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx             ← job listing dashboard
│   ├── jobs/
│   │   └── [id]/page.tsx    ← job detail view
│   └── api/                 ← Next.js route handlers (proxy to FastAPI)
├── components/
│   ├── JobCard.tsx
│   ├── JobList.tsx
│   └── StatusBadge.tsx
└── lib/
    └── api.ts               ← typed fetch wrappers for FastAPI endpoints
```

## What NOT to Do

- Do not suggest `pandas` for simple data tasks — plain Python dicts and lists are fine.
- Do not add Redis, Celery, or any message queue — SQLite job queue is sufficient.
- Do not use `multiprocessing` — stick to `asyncio`.
- Do not suggest cloud deployment steps; this is local-only.
- Do not install `playwright` or `selenium` without explicit user approval.
- Do not suggest models larger than 3B parameters for Ollama.
