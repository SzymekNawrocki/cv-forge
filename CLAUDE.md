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
├── main.py                     ← FastAPI entry; runs create_all + idempotent ALTER TABLE migrations on startup
├── .env                        ← DATABASE_URL, GEMINI_API_KEY
├── requirements.txt
├── ai/
│   ├── client.py               ← GeminiClient (alias: OllamaClient): analyze_jd, forge_section, clean_cv, calculate_match_score, parse_entries_section
│   ├── prompts.py              ← Prompt templates (ANALYZE_JD, FORGE_SECTION, CLEAN_CV, MATCH_SCORE, PARSE_ENTRIES, FORMAT_CV_JSON)
│   └── ollama_client.py        ← Legacy low-level helper (unused, do not delete yet)
├── db/
│   ├── base.py                 ← Async engine, SessionLocal, get_session()
│   └── models.py               ← UserProfile, MasterCV, JobDescription, TailoredCV, Skill
├── domain/
│   ├── schemas.py              ← Pydantic I/O models (incl. UserProfileRead/Update, CVFormData + sub-schemas, CVLinksUpdate)
│   ├── cv_logic/
│   │   ├── parser.py           ← split_sections() / merge_sections() on ## headers
│   │   └── cv_json_builder.py  ← build_cv_json(md, client, github_url, portfolio_url): prefers explicit links over regex
│   ├── parsers/
│   │   └── job_parser.py       ← Job listing parser
│   └── scrapers/
│       └── base.py             ← Scraper base class
├── services/
│   ├── forge_service.py        ← import_cv() (accepts links), create_cv_from_form() (no AI, _form_to_markdown()), run_forge()
│   ├── profile_service.py      ← get_or_create_profile(), update_profile() — singleton UserProfile CRUD
│   ├── skills_service.py       ← list_skills(), create_skill(), update_skill(), delete_skill(), build_skills_markdown()
│   └── job_service.py          ← Job CRUD helpers
├── routers/
│   ├── cv.py                   ← POST /cv/import, POST /cv/create, GET /cv/, GET /cv/{id}, PUT /cv/{id}/links, POST /cv/forge
│   ├── profile.py              ← GET /profile/, PUT /profile/
│   ├── skills.py               ← GET /skills/, POST /skills/, PUT /skills/{id}, DELETE /skills/{id}
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

## UserProfile Architecture

`UserProfile` table: `id`, `name`, `job_title`, `email`, `phone`, `location`, `github_url`, `portfolio_url`, `updated_at`. **Singleton** — always one row (id=1), created on first `GET /profile/`.

- Managed via `/profile` page.
- `github_url` and `portfolio_url` are global defaults — auto-filled into new CV forms (both import and manual).
- Each `MasterCV` stores its own `github_url` and `portfolio_url` columns for **per-CV override**. Editable inline on the CV card in `/cv-manager`.
- At forge time, `build_cv_json()` reads links from `MasterCV` columns (not from parsing markdown). Old CVs without explicit links fall back to regex extraction from the markdown header.

## Skills DB Architecture

`Skill` table: `id`, `category` (str), `items` (JSON array of strings), `created_at`.

- Managed via `/skills` page (CRUD UI: add category + tag list, edit inline, delete).
- `build_skills_markdown(skills)` in `skills_service.py` converts rows to `- **Category:** item1, item2` format.
- `MasterCV` markdown remains source of truth for all non-skills sections (About Me, Work Experience, Projects, Education, Languages, Certifications).
- **Skills injection (Option B)**: forge loop injects full DB skills list only if the CV has **no existing skills content**. Form-created CVs with explicit skill selections are preserved; text-imported CVs (no skills) still get full DB injection.

## CV Creation Paths

Two paths — both produce a `MasterCV` row:

| Path | Endpoint | AI call? | Links source |
|---|---|---|---|
| Import raw text | `POST /cv/import` | Yes — `clean_cv` (Gemini) | From request body (pre-filled from UserProfile in UI) |
| Manual form | `POST /cv/create` | **No** — `_form_to_markdown()` generates canonical markdown directly | From form fields (pre-filled from UserProfile) |

`_form_to_markdown()` in `forge_service.py` converts `CVFormData` to canonical markdown. No Gemini call — data is already structured.

## Forge Loop
1. `POST /cv/import` — raw text + optional `github_url`/`portfolio_url` → `clean_cv` (Gemini) → `_normalize_cv_markdown()` → `MasterCV` saved with explicit link fields
   **OR** `POST /cv/create` — structured `CVFormData` → `_form_to_markdown()` → `MasterCV` saved directly (no AI)
2. `POST /cv/forge` — select `MasterCV` + paste JD → `analyze_jd` (Gemini) extracts keywords + `job_title` → `calculate_match_score` (Gemini) scores original CV → **if `Skill` rows exist AND CV has no skills content**, replace Skills section with full DB skills list → `forge_section` (Gemini) rewrites each FORGEABLE section (body only, no `##` heading) → `merge_sections()` reconstructs markdown → `calculate_match_score` (Gemini) scores tailored CV → `build_cv_json(md, ollama, github_url=cv.github_url, portfolio_url=cv.portfolio_url)` (Python + Gemini `parse_entries_section` for Work Experience) converts tailored markdown to structured JSON, preferring explicit links → `TailoredCV` saved with `content_json`, `initial_match_score`, `match_score`

## Frontend Pages (`apps/web/src/app`)
| Route | Description |
|---|---|
| `/` | Job listings |
| `/jobs/[id]` | Job detail |
| `/cv-manager` | Two tabs: "Import Text" (paste raw + AI clean) or "Fill In Manually" (structured form). Browse saved CVs in sidebar; inline link editor per CV card. |
| `/skills` | Skills DB manager — add/edit/delete skill categories with tag-input UI |
| `/forge` | JD input (left) / PDF preview + inline editor (right) + Before→After score badges + Download PDF |
| `/profile` | Global profile settings — name, job title, contact info, GitHub URL, portfolio URL. Auto-fills new CV forms. |

All API calls go through `src/lib/api.ts`. Client Components only at leaf level.

## Frontend Dependencies
- `@react-pdf/renderer` — renders `TailoredCV.content_json` as a real PDF in the browser
- `CVDocument.tsx` (`src/components/`) — @react-pdf/renderer Document; **Roboto font** (Latin + Latin Extended — full Polish support: ą ć ę ł ń ó ś ź ż), two-column header with icon boxes, uppercase section dividers. `BoldText` renders `**bold**` markdown; bold text in PROJECTS and CERTIFICATIONS sections is also underlined (`underlineBold` prop, driven by `UNDERLINE_BOLD_SECTIONS` set).
- `CVManualForm.tsx` (`src/components/`) — structured form for manual CV creation. Dynamic arrays (map-based) for work experience, projects, education, languages, certifications. Chip/tag input for skills (pre-populated from Skills DB; user selects subset). Pre-fills header fields from UserProfile. Dynamically imported with `ssr: false`.
- `CVViewer.tsx` (`src/components/`) — `"use client"` wrapper with `PDFViewer` (WYSIWYG preview) + `PDFDownloadLink`; dynamically imported with `ssr: false` in forge page
- Font files: `apps/web/public/fonts/Roboto-{Regular,Bold,Italic,BoldItalic}.ttf` — merged latin + latin-ext subsets via fonttools (Python). Registered via `Font.register()` using `window.location.origin` base URL (safe since CVDocument is browser-only via ssr:false).
- Forge page has **Preview / Edit tabs** after forge runs — Edit tab shows per-section accordion with textareas that live-update the PDF preview via `editedData` state.
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
- **DB init**: `create_all` runs in two places — `init_db.py` (pre-dev) and `main.py` lifespan (idempotent safety net). No Alembic yet. New columns on existing tables are added via `ALTER TABLE … ADD COLUMN IF NOT EXISTS` in both places (idempotent — safe to run repeatedly).
- **TDD**: Tests in `apps/api/tests/` using pytest-asyncio.
- **Skills**: Matt Pocock skills installed in `.claude/skills/`.
- **Clean Architecture**: Routers → Services → Domain/DB. No DB calls in routers.
- **RAM**: Keep concurrency ≤ 3 (Turbo minimum for 2 persistent tasks). No LangChain/LlamaIndex. Process CV sections sequentially.
- **Windows Python**: Use `.venv\Scripts\python.exe` in `apps/api/package.json` scripts — `python` and `python3` are not on PATH, only `py` (Windows Launcher). Venv lives at `apps/api/.venv`.
- **No emojis in Python prints**: Windows console uses cp1250 — emoji in `print()` raises `UnicodeEncodeError` at startup.
