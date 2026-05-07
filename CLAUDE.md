# CV Forge — CLAUDE.md

## Project Mission
AI tool for entry-level candidates. Takes a **Master CV** (Markdown) + a **Job Description**, uses the Gemini API to surgically rewrite CV sections for ATS compatibility and professional impact.

## Hardware Constraints (8GB RAM)
- AI calls go to Gemini API (cloud) — no local model RAM usage.
- Process CV sections sequentially. Avoid large in-memory objects.
- No LangChain/LlamaIndex.

## Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4 — `apps/web`
- **Backend**: FastAPI (Python 3.11+), httpx — `apps/api`
- **Database**: Neon DB (PostgreSQL), `DATABASE_URL` in `apps/api/.env`
- **ORM**: SQLAlchemy (Async) + asyncpg

## Backend Architecture (`apps/api`)

```
apps/api/
├── main.py                     ← FastAPI entry; runs create_all on startup
├── .env                        ← DATABASE_URL, GEMINI_API_KEY
├── requirements.txt
├── ai/
│   ├── client.py               ← GeminiClient (alias: OllamaClient): analyze_jd, forge_section, clean_cv, calculate_match_score, parse_entries_section
│   ├── prompts.py              ← Prompt templates (ANALYZE_JD, FORGE_SECTION, CLEAN_CV, MATCH_SCORE, PARSE_ENTRIES, FORMAT_CV_JSON)
│   └── ollama_client.py        ← Legacy low-level helper (unused, do not delete yet)
├── db/
│   ├── base.py                 ← Async engine, SessionLocal, get_session()
│   └── models.py               ← MasterCV, JobDescription, TailoredCV
├── domain/
│   ├── schemas.py              ← Pydantic I/O models
│   ├── cv_logic/
│   │   ├── parser.py           ← split_sections() / merge_sections() on ## headers
│   │   └── cv_json_builder.py  ← build_cv_json(): Python-based markdown→CVData JSON; calls parse_entries_section for Work Experience only
│   ├── parsers/
│   │   └── job_parser.py       ← Job listing parser
│   └── scrapers/
│       └── base.py             ← Scraper base class
├── services/
│   ├── forge_service.py        ← import_cv() (clean_cv → normalize → save), run_forge() orchestration; _normalize_cv_markdown() safety net
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

## Canonical CV Markdown Format

`clean_cv` must produce this exact structure (enforced by `CLEAN_CV_PROMPT` and `_normalize_cv_markdown`):

```
# Full Name
Job Title
email@example.com
+48 000 000 000
Portfolio | GitHub
City

## About Me
Prose paragraph.

## Skills
- **Category:** item1, item2

## Projects
- **Project Name:** description

## Work Experience
### Company Name
Role | Date Range
- bullet

## Education
- **Institution:** Degree | years

## Languages
- English: C1

## Certifications
- **Cert Name Year**
```

Rules:
- `# Name` on line 1 — single `#` only. `## #` or `## ##` are double-prefix bugs.
- Contact info as plain lines BEFORE the first `##` section — `split_sections()` puts this in the "header" key, parsed by `_extract_header()`.
- `FORGE_SECTION_PROMPT` rule 4: rewritten output must NOT include the `##` heading — `merge_sections()` adds it. If Gemini includes it, double-wrapping corrupts all subsequent parsing.
- `_normalize_cv_markdown()` in `forge_service.py` strips `## #→#` and `##  ##→##` as a safety net after `clean_cv`.
- Education is `bullets` type (not `entries`) — matches original CV's `**Institution:** degree | years` format.

## Forge Loop
1. `POST /cv/import` — raw text → `clean_cv` (Gemini) → `_normalize_cv_markdown()` → `MasterCV` saved to DB
2. `POST /cv/forge` — select `MasterCV` + paste JD → `analyze_jd` (Gemini) extracts keywords + `job_title` → `calculate_match_score` (Gemini) scores original CV → `forge_section` (Gemini) rewrites each FORGEABLE section (body only, no `##` heading) → `merge_sections()` reconstructs markdown → `calculate_match_score` (Gemini) scores tailored CV → `build_cv_json()` (Python + Gemini `parse_entries_section` for Work Experience) converts tailored markdown to structured JSON → `TailoredCV` saved with `content_json`, `initial_match_score`, `match_score`

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
- `CVDocument.tsx` (`src/components/`) — @react-pdf/renderer Document; Helvetica, two-column header, uppercase section dividers. `BoldText` renders `**bold**` markdown; bold text in PROJECTS and CERTIFICATIONS sections is also underlined (`underlineBold` prop, driven by `UNDERLINE_BOLD_SECTIONS` set).
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
- **Gemini SDK**: Use `google-genai` (not the deprecated `google-generativeai`). Import: `from google import genai`. Model: `gemini-2.5-flash` (free tier, 15 RPM — sufficient for single-user forge). Fall back to `gemini-2.5-flash-lite` (30 RPM) only if rate limits are a problem.
- **JSON Only**: All Gemini calls use `response_mime_type="application/json"`. Parse with `_parse_json()` in `ai/client.py`.
- **DB init**: `create_all` runs in two places — `init_db.py` (pre-dev) and `main.py` lifespan (idempotent safety net). No Alembic yet.
- **TDD**: Tests in `apps/api/tests/` using pytest-asyncio.
- **Skills**: Matt Pocock skills installed in `.claude/skills/`.
- **Clean Architecture**: Routers → Services → Domain/DB. No DB calls in routers.
- **RAM**: Keep concurrency ≤ 3 (Turbo minimum for 2 persistent tasks). No LangChain/LlamaIndex. Process CV sections sequentially.
- **Windows Python**: Use `.venv\Scripts\python.exe` in `apps/api/package.json` scripts — `python` and `python3` are not on PATH, only `py` (Windows Launcher). Venv lives at `apps/api/.venv`.
- **No emojis in Python prints**: Windows console uses cp1250 — emoji in `print()` raises `UnicodeEncodeError` at startup.
