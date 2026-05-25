# CV Forge

AI-powered CV tailoring for entry-level candidates. Paste a job description, select your Master CV, and the AI rewrites each section to maximise ATS keyword coverage. You review the output and remove anything inaccurate before downloading a polished PDF.

---

## How It Works

1. **Build your Master CV** — import raw text (AI-cleaned to canonical Markdown) or fill in a structured form
2. **Manage your Skills DB** — maintain a categorised skills list injected automatically at forge time
3. **Forge** — paste a job description, the AI analyses keywords, rewrites each CV section, scores the match before and after, and produces a downloadable PDF
4. **Review & edit** — per-section editor live-updates the PDF preview; delete any inaccurate AI insertions

---

## Screenshots

### CV Manager — Import Text
Paste raw CV text. AI cleans and restructures it into canonical Markdown.

![CV Manager — Import](docs/screenshots/cv-manager-import.png)

### CV Manager — Fill In Manually
Structured form with dynamic arrays for work experience, projects, education, languages, and certifications. Skills are pre-populated from your Skills DB.

![CV Manager — Manual Form](docs/screenshots/cv-manager-manual.png)

### Forge — Setup
Paste the full job description, select a Master CV, and toggle Aggressive mode.

![Forge — Setup](docs/screenshots/forge-setup.png)

### Forge — Preview
Before → After ATS match score badges. The tailored CV renders as a real PDF in the browser.

![Forge — Preview](docs/screenshots/forge-preview.png)

### Forge — Edit
Per-section accordion editor. Live-updates the PDF preview as you type.

![Forge — Edit](docs/screenshots/forge-edit.png)

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend framework | Next.js (App Router) | 16.2.4 |
| UI library | React | 19.2.4 |
| Styling | Tailwind CSS | v4 |
| Language (frontend) | TypeScript | ^5 |
| Data fetching | SWR | 2.4.1 |
| PDF rendering | @react-pdf/renderer | 4.5.1 |
| Backend framework | FastAPI | 0.115.0 |
| ASGI server | Uvicorn | 0.30.6 |
| Language (backend) | Python | 3.11+ |
| ORM | SQLAlchemy (async) | 2.0.49 |
| DB driver | asyncpg | 0.31.0 |
| Data validation | Pydantic | 2.13.4 |
| HTTP client | httpx | 0.28.1 |
| Auth | fastapi-users | 13.0.0 |
| OAuth client | httpx-oauth | 0.16.1 |
| Email | Resend SDK | 2.0.0 |
| AI SDK | openai (OpenAI-compat) | ≥1.30.0 |
| Rate limiting | slowapi / limits | 0.1.9 / 5.8.0 |
| Database | PostgreSQL (Neon DB) | — |
| Monorepo | Turborepo | latest |
| Package manager | npm | 10.9.7 |

---

## AI Model Cascade

All AI calls route through a `ModelCascade` that tries models in order, placing any rate-limited model in a 60-second cooldown before falling through to the next.

**Groq** (primary — fast LPU inference):
1. `llama-3.3-70b-versatile` ← default
2. `meta-llama/llama-4-scout-17b-16e-instruct`

**OpenRouter** (fallback — free tier):
3. `google/gemma-4-26b-a4b-it:free`
4. `google/gemma-4-31b-it:free`
5. `qwen/qwen3-next-80b-a3b-instruct:free`
6. `nvidia/nemotron-3-super-120b-a12b:free`

Users can override the primary model per-account in Settings.

---

## Project Structure

```
cv-forge/
├── apps/
│   ├── api/                        ← FastAPI backend (port 8000)
│   │   ├── main.py                 ← App entry, CORS, rate-limit handler, DB init
│   │   ├── init_db.py              ← Standalone table creation (runs before dev)
│   │   ├── requirements.txt
│   │   ├── ai/
│   │   │   ├── cascade.py          ← ModelCascade: ordered fallback + cooldown logic
│   │   │   ├── client.py           ← OpenRouterClient — typed AI methods
│   │   │   ├── prompts.py          ← Prompt templates (ANALYZE_JD, FORGE_SECTION, …)
│   │   │   └── schemas.py          ← Pydantic AI response models
│   │   ├── auth/                   ← fastapi-users config, Google OAuth router
│   │   ├── db/
│   │   │   ├── base.py             ← Async engine, SessionLocal, get_session()
│   │   │   └── models.py           ← User, UserProfile, MasterCV, TailoredCV, Skill
│   │   ├── domain/
│   │   │   ├── schemas.py          ← Pydantic I/O models
│   │   │   ├── cv_logic/           ← split_sections(), merge_sections(), cv_json_builder
│   │   │   └── parsers/            ← Job listing parser
│   │   ├── routers/                ← cv, profile, skills, jobs
│   │   ├── services/               ← forge_service, profile_service, skills_service
│   │   └── tests/                  ← pytest unit tests (37 pure-function tests)
│   └── web/                        ← Next.js 16 frontend (port 3000)
│       └── src/
│           ├── app/
│           │   ├── page.tsx         ← Job board
│           │   ├── jobs/[id]/       ← Job detail
│           │   ├── forge/           ← Forge page
│           │   ├── cv-manager/      ← CV Manager
│           │   ├── skills/          ← Skills DB
│           │   ├── settings/        ← AI model selector
│           │   ├── login/
│           │   ├── register/
│           │   └── verify-email/
│           ├── components/
│           │   ├── CVDocument.tsx   ← @react-pdf/renderer PDF template (Roboto, Polish chars)
│           │   ├── CVViewer.tsx     ← PDF preview + download links
│           │   ├── CVManualForm.tsx ← Structured CV creation form
│           │   └── forge/
│           │       ├── ForgeSetup.tsx
│           │       ├── ForgeReview.tsx
│           │       ├── ForgeProgress.tsx
│           │       ├── CVEditor.tsx
│           │       └── CVEditorSidebar.tsx
│           └── lib/
│               └── api.ts           ← All typed fetch wrappers
├── packages/
├── tools/
└── turbo.json
```

---

## Prerequisites

- Node.js ≥ 18 with npm 10
- Python 3.11+
- A PostgreSQL database — [Neon](https://neon.tech) free tier works
- A [Groq](https://console.groq.com) API key (free, recommended primary provider)
- An [OpenRouter](https://openrouter.ai) API key (free, fallback provider)
- A [Google Cloud](https://console.cloud.google.com) OAuth 2.0 client (for Google sign-in)
- A [Resend](https://resend.com) API key (for email verification)

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/your-username/cv-forge.git
cd cv-forge
npm install
```

### 2. Python virtual environment

```bash
cd apps/api
python -m venv .venv

# Windows
.venv\Scripts\pip install -r requirements.txt

# macOS / Linux
.venv/bin/pip install -r requirements.txt

cd ../..
```

### 3. Configure environment variables

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env`:

```env
# Database (PostgreSQL)
DATABASE_URL=postgresql+asyncpg://user:password@host/dbname

# AI providers
GROQ_API_KEY=gsk_...                  # primary (fast, free)
OPENROUTER_API_KEY=sk-or-...          # fallback (free tier)

# Auth
JWT_SECRET=a-long-random-secret-string

# Google OAuth — create at console.cloud.google.com
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...

# Email verification — resend.com
RESEND_API_KEY=re_...

# Frontend URL (CORS + email links)
FRONTEND_URL=http://localhost:3000
```

### 4. Start development

```bash
npm run dev
```

Turborepo runs three tasks in sequence:

| Task | What it does | Port |
|---|---|---|
| `init-db` | Creates all tables via SQLAlchemy (exits) | — |
| `api` | Uvicorn FastAPI server | 8000 |
| `web` | Next.js dev server | 3000 |

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string (`postgresql+asyncpg://…`) |
| `OPENROUTER_API_KEY` | Yes | OpenRouter API key — free-tier fallback AI |
| `JWT_SECRET` | Yes | Secret used to sign session tokens |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth 2.0 client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth 2.0 client secret |
| `RESEND_API_KEY` | Yes | Resend key for verification emails |
| `GROQ_API_KEY` | Recommended | Groq key — fast primary AI (LPU inference) |
| `FRONTEND_URL` | Recommended | Frontend origin for CORS and email links |

---

## Running Tests

```bash
cd apps/api

# Windows
.venv\Scripts\python.exe -m pytest tests/ -v

# macOS / Linux
.venv/bin/python -m pytest tests/ -v
```

37 unit tests cover CV Markdown parsing, section splitting/merging, header extraction, and skills serialisation. No mocks, no I/O — pure function tests only.

---

## API Endpoints

Interactive docs available at `http://localhost:8000/docs` while the API is running.

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/register` | Register with email + password |
| `POST` | `/auth/login` | Log in, receive JWT cookie |
| `POST` | `/auth/logout` | Clear session |
| `GET` | `/auth/google/authorize` | Start Google OAuth flow |
| `GET` | `/cv/` | List Master CVs for current user |
| `POST` | `/cv/import` | Import raw CV text (AI-cleaned) |
| `POST` | `/cv/create` | Create CV from structured form (no AI) |
| `GET` | `/cv/{id}` | Get a single Master CV |
| `PUT` | `/cv/{id}/links` | Update per-CV GitHub / portfolio URLs |
| `POST` | `/cv/forge` | Run the forge loop — returns tailored CV + scores |
| `DELETE` | `/cv/{id}` | Delete a Master CV |
| `GET` | `/jobs/` | List job listings |
| `GET` | `/jobs/{id}` | Get job detail |
| `GET` | `/skills/` | List skill categories |
| `POST` | `/skills/` | Create skill category |
| `PUT` | `/skills/{id}` | Update skill category |
| `DELETE` | `/skills/{id}` | Delete skill category |
| `GET` | `/profile/` | Get user profile |
| `PUT` | `/profile/` | Update user profile |

---

## The Forge Loop

```
POST /cv/forge
├── analyze_jd()              → extracts required + nice-to-have keywords, job title
├── calculate_match_score()   → ATS score for the original CV
├── [if Skills DB rows exist AND CV has no skills section]
│     → replace Skills section with full DB skills list
├── for each forgeable section:
│     forge_section()         → rewrites with JD keywords inserted
│         (Aggressive mode: inserts keywords even if absent from original CV)
├── merge_sections()          → reconstructs canonical Markdown
├── calculate_match_score()   → ATS score for the tailored CV
└── build_cv_json()           → converts Markdown → structured JSON for PDF renderer
```

The user reviews the result in the **Edit tab**, deletes any inaccurate AI insertions, then downloads the clean PDF.

---

## CV Creation Paths

| Path | Endpoint | AI call? | Notes |
|---|---|---|---|
| Import raw text | `POST /cv/import` | Yes — `clean_cv` normalises to canonical Markdown | GitHub + portfolio pre-filled from UserProfile |
| Fill in manually | `POST /cv/create` | No — `_form_to_markdown()` generates Markdown directly | Skills chip-selector pre-populated from Skills DB |

Both paths produce a `MasterCV` row. Per-CV GitHub and portfolio URLs can be edited inline in the CV Manager and override the global profile defaults at forge time.

---

## License

MIT
