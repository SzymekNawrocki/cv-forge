# CV Forge — CLAUDE.md

## Project Mission
AI tool for entry-level candidates. Takes a **Master CV** (Markdown) + a **Job Description**, uses local Ollama to surgically rewrite CV sections for ATS compatibility and professional impact.

## Hardware Constraints (8GB RAM)
- Ollama REST API only: `http://localhost:11434`. No LangChain/LlamaIndex.
- Models: `qwen2.5-coder:3b` (forge/rewrite), `llama3.2:1b` (analysis/cleaning).
- Process CV sections sequentially. Avoid large in-memory objects.

## Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4 — `apps/web`
- **Backend**: FastAPI (Python 3.11+), httpx — `apps/api`
- **Database**: Neon DB (PostgreSQL), `DATABASE_URL` in `apps/api/.env`
- **ORM**: SQLAlchemy (Async) + asyncpg

## Backend Architecture (`apps/api`)

```
apps/api/
├── main.py                     ← FastAPI entry; runs create_all on startup
├── .env                        ← DATABASE_URL, OLLAMA_BASE_URL
├── requirements.txt
├── ai/
│   ├── client.py               ← OllamaClient: analyze_jd, forge_section, clean_cv
│   ├── prompts.py              ← Prompt templates (ANALYZE_JD, FORGE_SECTION, CLEAN_CV)
│   └── ollama_client.py        ← Legacy low-level generate() helper
├── db/
│   ├── base.py                 ← Async engine, SessionLocal, get_session()
│   └── models.py               ← MasterCV, JobDescription, TailoredCV
├── domain/
│   ├── schemas.py              ← Pydantic I/O models
│   ├── cv_logic/
│   │   └── parser.py           ← split_sections() / merge_sections() on ## headers
│   ├── parsers/
│   │   └── job_parser.py       ← Job listing parser
│   └── scrapers/
│       └── base.py             ← Scraper base class
├── services/
│   ├── forge_service.py        ← import_cv(), run_forge() orchestration
│   └── job_service.py          ← Job CRUD helpers
├── routers/
│   ├── cv.py                   ← POST /cv/import, GET /cv/, GET /cv/{id}, POST /cv/forge
│   ├── jobs.py                 ← GET /jobs/, GET /jobs/{id}
│   ├── search.py               ← POST /search/ (stub)
│   └── recruiters.py           ← GET /recruiters/ (stub)
└── tests/
    ├── conftest.py
    └── test_job_parser.py
```

## Forge Loop
1. `POST /cv/import` — raw text → `clean_cv` (1b) → `MasterCV` saved to DB
2. `POST /cv/forge` — select `MasterCV` + paste JD → `analyze_jd` (1b) extracts keywords → `forge_section` (3b) rewrites Summary/Experience/Skills → `TailoredCV` saved to DB

## Frontend Pages (`apps/web/src/app`)
| Route | Description |
|---|---|
| `/` | Job listings |
| `/jobs/[id]` | Job detail |
| `/cv-manager` | Import raw CV + browse saved CVs |
| `/forge` | JD input (left) / tailored markdown result (right) |

All API calls go through `src/lib/api.ts`. Client Components only at leaf level.

## Development Rules
- **JSON Only**: All Ollama calls use `format: "json"`. Parse with `_parse_json()` in `ai/client.py`.
- **DB init**: `create_all` on startup — no Alembic yet.
- **TDD**: Tests in `apps/api/tests/` using pytest-asyncio.
- **Skills**: Matt Pocock skills installed in `.claude/skills/`.
- **Clean Architecture**: Routers → Services → Domain/DB. No DB calls in routers.
