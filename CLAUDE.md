# CV Forge — CLAUDE.md

## Project Mission
AI tool for entry-level candidates. Takes a **Master CV** (Markdown) + a **Job Description**, uses the OpenRouter API to aggressively rewrite CV sections for maximum ATS keyword coverage. The user reviews AI output and removes inaccurate claims themselves.

## Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4 — `apps/web`
- **Backend**: FastAPI (Python 3.11+), httpx — `apps/api`
- **Database**: Neon DB (PostgreSQL), `DATABASE_URL` in `apps/api/.env`
- **ORM**: SQLAlchemy (Async) + asyncpg

## Backend Architecture (`apps/api`)

```
apps/api/
├── main.py                     ← FastAPI entry; runs create_all + idempotent ALTER TABLE migrations on startup
├── .env                        ← DATABASE_URL, OPENROUTER_API_KEY, GROQ_API_KEY
├── requirements.txt
├── ai/
│   ├── cascade.py              ← ModelCascade: model fallback, cooldown, 3-step JSON parsing, usage_callback
│   ├── client.py               ← OpenRouterClient (alias: OllamaClient): methods return typed schema objects
│   ├── prompts.py              ← Prompt templates (ANALYZE_JD, CLEAN_CV_JSON, FORGE_SECTION, PARSE_ENTRIES, FORMAT_CV_JSON)
│   └── schemas.py              ← Pydantic AI response models: JDAnalysis, ForgeResult, CleanCVJSON, ParsedEntries, WorkEntry
├── db/
│   ├── base.py                 ← Async engine, SessionLocal, get_session()
│   └── models.py               ← UserProfile, MasterCV, JobDescription, TailoredCV, Skill, AICallLog
├── domain/
│   ├── schemas.py              ← Pydantic I/O models (incl. UserProfileRead/Update, CVFormData + sub-schemas, CVLinksUpdate)
│   ├── cv_logic/
│   │   ├── parser.py           ← split_sections() / merge_sections() on ## headers
│   │   ├── cv_json_builder.py  ← build_cv_json(md, client, github_url, portfolio_url): prefers explicit links over regex
│   │   ├── forge_pipeline.py   ← forge_cv(): parallel section forge (asyncio.gather + Semaphore(3)), deterministic scoring
│   │   └── match_score.py      ← calculate_match_score(): rapidfuzz + synonym table, no LLM call
│   └── parsers/
│       └── job_parser.py       ← Job listing parser
├── services/
│   ├── forge_service.py        ← import_cv(), create_cv_from_form(), run_forge(), list_master_cvs(), update_master_cv_links()
│   ├── profile_service.py      ← get_or_create_profile(), update_profile() — singleton UserProfile CRUD
│   └── skills_service.py       ← list_skills(), create_skill(), update_skill(), delete_skill(), build_skills_markdown()
├── routers/
│   ├── cv.py                   ← POST /cv/import, POST /cv/create, GET /cv/, GET /cv/{id}, PUT /cv/{id}/links, POST /cv/forge, DELETE /cv/{id}
│   ├── profile.py              ← GET /profile/, PUT /profile/, GET /profile/usage
│   ├── skills.py               ← GET /skills/, POST /skills/, PUT /skills/{id}, DELETE /skills/{id}
│   └── jobs.py                 ← GET /jobs/, GET /jobs/{id}
└── tests/
    ├── conftest.py
    ├── test_job_parser.py
    ├── test_forge_pipeline.py  ← Async tests for forge_cv() retry logic, strategy routing, failed sections
    └── test_cv_pure.py         ← 62 unit tests: split/merge, parse_bullets, extract_header, match_score, form_to_markdown, build_skills_markdown
```

## Canonical CV Markdown Format

Both `import_cv` and `create_cv_from_form` produce this exact structure via `_form_to_markdown()` in `forge_service.py`:

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
- `# Name` on line 1 — single `#` only.
- Contact info as plain lines BEFORE the first `##` section — `split_sections()` puts this in the "header" key, parsed by `_extract_header()`.
- `FORGE_SECTION_PROMPT` rule: rewritten output must NOT include the `##` heading — `merge_sections()` adds it. If the model includes it, double-wrapping corrupts all subsequent parsing.
- Education is `bullets` type (not `entries`) — matches original CV's `**Institution:** degree | years` format.

## UserProfile Architecture

`UserProfile` table: `id`, `name`, `job_title`, `email`, `phone`, `location`, `github_url`, `portfolio_url`, `preferred_model`, `updated_at`. **Singleton per user** — one row per user, created on first `GET /profile/`.

- `github_url` and `portfolio_url` are global defaults — auto-filled into new CV forms (both import and manual).
- `preferred_model` — OpenRouter model ID chosen in `/settings`. `run_forge()` reads this and instantiates `OllamaClient(preferred_model=...)`. Defaults to Groq primary if null.
- Each `MasterCV` stores its own `github_url` and `portfolio_url` columns for **per-CV override**. Editable inline on the CV card in `/cv-manager`.
- At forge time, `build_cv_json()` reads links from `MasterCV` columns (not from parsing markdown). Old CVs without explicit links fall back to regex extraction from the markdown header.

## Skills DB Architecture

`Skill` table: `id`, `category` (str), `items` (JSON array of strings), `created_at`.

- Managed via `/skills` page (CRUD UI: add category + tag list, edit inline, delete).
- `build_skills_markdown(skills)` in `skills_service.py` converts rows to `- **Category:** item1, item2` format.
- `MasterCV` markdown remains source of truth for all non-skills sections (About Me, Work Experience, Projects, Education, Languages, Certifications).
- **Skills injection (Option B)**: forge loop injects full DB skills list only if the CV has **no existing skills content**. Form-created CVs with explicit skill selections are preserved; text-imported CVs (no skills) still get full DB injection.

## AICallLog Architecture

`AICallLog` table: `id`, `user_id`, `model`, `prompt_tokens`, `completion_tokens`, `latency_ms`, `success`, `error_type`, `created_at`.

- `ModelCascade` accepts an optional `usage_callback: async (model, prompt_tokens, completion_tokens, latency_ms) -> None`.
- `run_forge()` passes a callback that appends to a local list, then writes all entries to `AICallLog` in Phase 3 (same transaction as `TailoredCV` save).
- `GET /profile/usage` returns today's token totals: `total_tokens_today`, `call_count_today`, `prompt_tokens_today`, `completion_tokens_today`.

## Match Scoring

Scoring is **deterministic Python** — no LLM call. `domain/cv_logic/match_score.py`:
- `calculate_match_score(cv_text, required_keywords, nice_to_have_keywords)` → `(score, missing_critical, missing_nice_to_have)`
- Uses `rapidfuzz.fuzz.ratio` (threshold 88%) for fuzzy single-word matching.
- Synonym table: `kubernetes`↔`k8s`, `ci/cd`↔`continuous integration`, `js`↔`javascript`, `aws`↔`amazon web services`, etc.
- Formula: start 100, −8 per missing critical (cap −80), −2 per missing nice-to-have.
- Makes retry convergence meaningful: scores don't drift between calls.

## CV Creation Paths

Two paths — both produce a `MasterCV` row via `_form_to_markdown()`:

| Path | Endpoint | AI call? | Links source |
|---|---|---|---|
| Import raw text | `POST /cv/import` | Yes — `clean_cv` → `CleanCVJSON` → `_clean_cv_json_to_form_data()` → `_form_to_markdown()` | User-provided overrides AI-extracted |
| Manual form | `POST /cv/create` | **No** — `_form_to_markdown()` generates canonical markdown directly | From form fields (pre-filled from UserProfile) |

Both paths go through `_form_to_markdown()` — one canonical place for markdown generation.

## Forge Loop
1. `POST /cv/import` — raw text + optional links → `clean_cv` (returns `CleanCVJSON`) → `_clean_cv_json_to_form_data()` → `_form_to_markdown()` → `MasterCV` saved
   **OR** `POST /cv/create` — structured `CVFormData` → `_form_to_markdown()` → `MasterCV` saved directly (no AI)
2. `POST /cv/forge` — `run_forge()`:
   - Phase 1 (short DB): load CV + skills + preferred_model, save JD, commit (releases connection before AI)
   - Phase 2 (AI): `analyze_jd` → keywords + `job_title` → `calculate_match_score` (Python, no LLM) → skills injection if needed → **parallel** `forge_section` calls (`asyncio.gather` + `Semaphore(3)`) → `calculate_match_score` after → optional one-pass retry (AGGRESSIVE only, score < 90) → `build_cv_json`
   - Phase 3 (short DB): save `TailoredCV` + `AICallLog` entries, commit

## Frontend Pages (`apps/web/src/app`)
| Route | Description |
|---|---|
| `/` | Job listings |
| `/jobs/[id]` | Job detail |
| `/cv-manager` | Two tabs: "Import Text" (paste raw + AI clean) or "Fill In Manually" (structured form). Browse saved CVs in sidebar; inline link editor per CV card. |
| `/skills` | Skills DB manager — add/edit/delete skill categories with tag-input UI |
| `/forge` | JD input (left) / PDF preview + inline editor (right) + Before→After score badges + Download PDF |
| `/settings` | App-wide settings — AI model selector (5 free OpenRouter models). Saves to `UserProfile.preferred_model` via `PUT /profile/`. |

All API calls go through `src/lib/api.ts`. Client Components only at leaf level.
- `APIError` class in `api.ts`: `new APIError(status, body)` — has `.isNotFound` and `.isServerError` helpers. Forge error display parses the JSON body for the `detail` field and shows `[status] detail`. ForgeSetup error banner has a Retry button.

## Frontend Dependencies
- `@react-pdf/renderer` — renders `TailoredCV.content_json` as a real PDF in the browser
- `CVDocument.tsx` (`src/components/`) — @react-pdf/renderer Document; **Roboto font** (Latin + Latin Extended — full Polish support: ą ć ę ł ń ó ś ź ż), two-column header with icon boxes, uppercase section dividers. `BoldText` renders `**bold**` markdown; bold text in PROJECTS and CERTIFICATIONS sections is also underlined (`underlineBold` prop, driven by `UNDERLINE_BOLD_SECTIONS` set). Portfolio and GitHub are rendered as separate blue underlined `<Link>` rows (clickable in PDF), with `https://` stripped from display text.
- `CVManualForm.tsx` (`src/components/`) — structured form for manual CV creation. Dynamic arrays (map-based) for work experience, projects, education, languages, certifications. Chip/tag input for skills (pre-populated from Skills DB; user selects subset). Pre-fills header fields from UserProfile. Dynamically imported with `ssr: false`.
- `CVViewer.tsx` (`src/components/`) — `"use client"` wrapper with `PDFViewer` (WYSIWYG preview) + `PDFDownloadLink`; dynamically imported with `ssr: false` in forge page
- Font files: `apps/web/public/fonts/Roboto-{Regular,Bold,Italic,BoldItalic}.ttf` — merged latin + latin-ext subsets via fonttools (Python). Registered via `Font.register()` using `window.location.origin` base URL (safe since CVDocument is browser-only via ssr:false).
- Forge page has **Preview / Edit tabs** after forge runs — Edit tab shows per-section accordion with textareas that live-update the PDF preview via `editedData` state.

## Dev Startup

`npm run dev` from root runs in this sequence:

1. **DB init** — `apps/api/init_db.py` via Turbo `init-db` task. Creates all tables via SQLAlchemy, exits. Runs before API uvicorn process.
2. **API** — uvicorn on `:8000`. Logs `API Ready - Database Connected` after lifespan `create_all`.
3. **Frontend** — `next dev` on `:3000`. Starts in parallel with API (App Router renders on demand, no startup pre-render).

Turbo config: `--concurrency=3` (2 persistent tasks require ≥3), `init-db` task is non-persistent/no-cache, `dev` task `dependsOn: ["init-db"]`.

## Development Rules
- **AI Provider**: All AI calls go through `OpenRouterClient._generate_json()` → `ModelCascade.generate_json()`. Tries Groq first (fast LPU), falls back to OpenRouter free models. Cascade order:
  **Groq** (primary, `GROQ_API_KEY`):
  1. `llama-3.3-70b-versatile` — default primary
  2. `meta-llama/llama-4-scout-17b-16e-instruct`
  **OpenRouter** (fallback, `OPENROUTER_API_KEY`):
  3. `google/gemma-4-26b-a4b-it:free`
  4. `google/gemma-4-31b-it:free`
  5. `qwen/qwen3-next-80b-a3b-instruct:free`
  6. `nvidia/nemotron-3-super-120b-a12b:free`
  User's `preferred_model` overrides the primary; cascade skips it and continues with remaining models. Models that 413 (payload too large) on real CV content are excluded from the list.
- **OpenRouter SDK**: `openai>=1.30.0` — `AsyncOpenAI(api_key=OPENROUTER_API_KEY, base_url="https://openrouter.ai/api/v1")`. Always pass `extra_headers={"HTTP-Referer": "https://cv-forge.app", "X-Title": "CV Forge"}` — required by OpenRouter for free models.
- **JSON parsing**: 3-step in `cascade.py` `parse_json()`: direct `json.loads` → fence-regex extract → simple strip. If all fail, one LLM JSON-only retry before moving to next model.
- **AI Response Schemas**: Every `OpenRouterClient` method returns a typed Pydantic object from `ai/schemas.py` — never a raw dict. Add new AI calls by: (1) defining a schema in `ai/schemas.py`, (2) calling `Schema.model_validate(raw)` inside the client method.
- **Aggressive Forge**: `FORGE_SECTION_PROMPT_AGGRESSIVE` has NO anti-fabrication rule. AI freely adds skills and experience language from the JD even if absent from the original CV. The user reviews output in the Edit tab and removes inaccurate claims.
- **DB init**: `create_all` runs in two places — `init_db.py` (pre-dev) and `main.py` lifespan (idempotent safety net). No Alembic yet. New columns on existing tables are added via `ALTER TABLE … ADD COLUMN IF NOT EXISTS` in both places (idempotent — safe to run repeatedly).
- **TDD**: Tests in `apps/api/tests/` using pytest-asyncio. Pure (no-IO) functions tested in `test_cv_pure.py` — no mocks needed. Run: `apps/api/.venv/Scripts/python.exe -m pytest tests/ -v`.
- **Skills**: Matt Pocock skills installed in `.claude/skills/`.
- **Clean Architecture**: Routers → Services → Domain/DB. No DB calls in routers. All CV list/mutate operations go through `forge_service.py` functions — routers never import `sqlalchemy.select`.
- **Concurrency**: Keep Turbo concurrency ≤ 3 (minimum for 2 persistent tasks). No LangChain/LlamaIndex. Forge sections run in parallel via `asyncio.gather` + `Semaphore(3)`.
- **Windows Python**: Use `.venv\Scripts\python.exe` in `apps/api/package.json` scripts — `python` and `python3` are not on PATH, only `py` (Windows Launcher). Venv lives at `apps/api/.venv`.
- **No emojis in Python prints**: Windows console uses cp1250 — emoji in `print()` raises `UnicodeEncodeError` at startup.
- **Next.js 16 Proxy (was Middleware)**: In Next.js 16, `middleware.ts` is renamed to `proxy.ts` and the export is `proxy` (not `middleware`). File lives at `apps/web/src/proxy.ts`. Same `config.matcher` syntax. Never create `middleware.ts` — it is ignored in Next.js 16.
- **`ssr: false` in Server Components**: `next/dynamic` with `{ ssr: false }` is only valid inside Client Components (`"use client"`). Never use it in Server Components (`layout.tsx`, `page.tsx` without `"use client"`). If the target component already has `"use client"`, just import it directly — no `dynamic` needed. If you must lazy-load it, create a thin `"use client"` wrapper that does the `dynamic` import, then import that wrapper from the Server Component.
