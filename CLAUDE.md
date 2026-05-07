# CV Forge — CLAUDE.md

## Project Mission
AI tool for entry-level candidates. Takes a **Master CV** (Markdown) + a **Job Description**, uses local Ollama to surgically rewrite CV sections for ATS compatibility and professional impact.

## Hardware Constraints (8GB RAM)
- Ollama REST API only: `http://localhost:11434`. No LangChain/LlamaIndex.
- Models: `qwen2.5-coder:3b` (forge/rewrite/format — ~1.9 GB), `llama3.2:1b` (analysis/cleaning — ~1.3 GB).
- Both must be pulled before use: `ollama pull qwen2.5-coder:3b && ollama pull llama3.2:1b`
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
│   ├── client.py               ← OllamaClient: analyze_jd, forge_section, clean_cv, calculate_match_score, format_cv_json
│   ├── prompts.py              ← Prompt templates (ANALYZE_JD, FORGE_SECTION, CLEAN_CV, MATCH_SCORE, FORMAT_CV_JSON)
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
2. `POST /cv/forge` — select `MasterCV` + paste JD → `analyze_jd` (1b) extracts keywords → `calculate_match_score` (1b) scores original CV → `forge_section` (3b) rewrites Summary/Experience/Skills → `calculate_match_score` (1b) scores tailored CV → `format_cv_json` (3b) converts tailored markdown to structured JSON → `TailoredCV` saved with `content_json`, `initial_match_score`, `match_score`

## Frontend Pages (`apps/web/src/app`)
| Route | Description |
|---|---|
| `/` | Job listings |
| `/jobs/[id]` | Job detail |
| `/cv-manager` | Import raw CV + browse saved CVs |
| `/forge` | JD input (left) / PDF preview (right) + Before→After score badges + Download PDF |

All API calls go through `src/lib/api.ts`. Client Components only at leaf level.

## Frontend Dependencies
- `@react-pdf/renderer` — renders `TailoredCV.content_json` as a real PDF in the browser
- `CVDocument.tsx` (`src/components/`) — @react-pdf/renderer Document; Helvetica, two-column header, uppercase section dividers matching original CV design
- `CVViewer.tsx` (`src/components/`) — `"use client"` wrapper with `PDFViewer` (WYSIWYG preview) + `PDFDownloadLink`; dynamically imported with `ssr: false` in forge page
- `react-markdown` + `remark-gfm` still in deps but no longer used in forge view

## Dev Startup

`npm run dev` from root runs in this sequence:

1. **RAM check** — `tools/check-ram.js` (node, `os.freemem()`). Exits 1 if < 1 GB free, blocking dev start.
2. **DB init** — `apps/api/init_db.py` via Turbo `init-db` task. Creates all tables via SQLAlchemy, exits. Runs before API uvicorn process.
3. **API** — uvicorn on `:8000`. Logs `API Ready - Database Connected` after lifespan `create_all`.
4. **Frontend** — `next dev` on `:3000`. Starts in parallel with API (App Router renders on demand, no startup pre-render).

Turbo config: `--concurrency=3` (2 persistent tasks require ≥3), `init-db` task is non-persistent/no-cache, `dev` task `dependsOn: ["init-db"]`.

## Development Rules
- **JSON Only**: All Ollama calls use `format: "json"`. Parse with `_parse_json()` in `ai/client.py`.
- **DB init**: `create_all` runs in two places — `init_db.py` (pre-dev) and `main.py` lifespan (idempotent safety net). No Alembic yet.
- **TDD**: Tests in `apps/api/tests/` using pytest-asyncio.
- **Skills**: Matt Pocock skills installed in `.claude/skills/`.
- **Clean Architecture**: Routers → Services → Domain/DB. No DB calls in routers.
- **RAM**: Keep concurrency ≤ 3 (Turbo minimum for 2 persistent tasks). No LangChain/LlamaIndex. Process CV sections sequentially.
- **Windows Python**: Use `.venv\Scripts\python.exe` in `apps/api/package.json` scripts — `python` and `python3` are not on PATH, only `py` (Windows Launcher). Venv lives at `apps/api/.venv`.
- **No emojis in Python prints**: Windows console uses cp1250 — emoji in `print()` raises `UnicodeEncodeError` at startup.
