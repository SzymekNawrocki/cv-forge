# CV Forge

AI-powered CV tailoring tool for entry-level candidates. Paste a job description, get a surgically rewritten CV optimised for ATS and scored for match quality — then download it as a polished PDF.

## How it works

1. **Build your Master CV** — import raw text (AI-cleaned) or fill in a structured form
2. **Manage your Skills DB** — maintain a categorised skills list that gets injected at forge time
3. **Forge** — paste a job description, the AI analyses it, rewrites each CV section, scores the match before and after, and produces a downloadable PDF

## Tech stack

| Layer | Technology | Version |
|---|---|---|
| Frontend framework | Next.js | 16.2.4 |
| UI library | React | 19.2.4 |
| CSS | Tailwind CSS | v4 |
| Language (frontend) | TypeScript | ^5 |
| PDF rendering | @react-pdf/renderer | ^4.5.1 |
| Backend framework | FastAPI | 0.115.0 |
| ASGI server | Uvicorn | 0.30.6 |
| Language (backend) | Python | 3.11+ |
| ORM | SQLAlchemy (async) | 2.0.49 |
| DB driver | asyncpg | 0.31.0 |
| Database | Neon DB (PostgreSQL) | — |
| Data validation | Pydantic | 2.13.4 |
| HTTP client | httpx | 0.28.1 |
| AI — primary | Gemini 2.5 Flash (`google-genai`) | 1.75.0 |
| AI — fallback | Groq `llama-3.3-70b-versatile` | 1.2.0 |
| Rate limiting | slowapi / limits | 0.1.9 / 5.8.0 |
| Monorepo | Turborepo | latest |
| Package manager | npm | 10.9.7 |

## Project structure

```
job-hunter/
├── apps/
│   ├── api/                  ← FastAPI backend (port 8000)
│   │   ├── ai/               ← GeminiClient, prompts, response schemas
│   │   ├── db/               ← SQLAlchemy models + async engine
│   │   ├── domain/           ← Pydantic I/O schemas, CV parsing logic
│   │   ├── routers/          ← /cv, /jobs, /skills, /profile
│   │   ├── services/         ← forge_service, profile_service, skills_service
│   │   ├── tests/
│   │   ├── main.py
│   │   ├── init_db.py
│   │   └── requirements.txt
│   └── web/                  ← Next.js frontend (port 3000)
│       └── src/
│           ├── app/          ← App Router pages
│           └── components/   ← CVDocument, CVViewer, CVManualForm, forge UI
├── packages/
│   ├── eslint-config/
│   ├── typescript-config/
│   └── ui/
├── tools/
│   └── check-ram.js          ← Blocks dev start if free RAM < 1 GB
└── turbo.json
```

## Prerequisites

- Node.js with npm 10.9.7+
- Python 3.11+
- A [Neon](https://neon.tech) (or any PostgreSQL) database
- A [Gemini API key](https://aistudio.google.com/app/apikey) (free tier: 15 RPM)
- _(Optional)_ A [Groq API key](https://console.groq.com) for rate-limit fallback (free tier: 30 RPM)

## Setup

**1. Clone and install**

```bash
git clone <repo-url>
cd job-hunter
npm install
```

**2. Create the Python virtual environment**

```bash
cd apps/api
py -m venv .venv
.venv\Scripts\pip install -r requirements.txt
```

**3. Configure environment variables**

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env`:

```env
# Required
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/dbname
GEMINI_API_KEY=your_gemini_key

# Optional
GROQ_API_KEY=                    # fallback when Gemini rate-limits
API_SECRET_KEY=                  # if set, all requests must send: Authorization: Bearer <value>
ALLOWED_ORIGINS=http://localhost:3000
```

**4. Start development**

```bash
npm run dev
```

This runs three tasks via Turborepo:

1. RAM check (exits if < 1 GB free)
2. `init_db.py` — creates all tables via SQLAlchemy
3. API on `:8000` + frontend on `:3000` (parallel)

## Pages

| Route | Description |
|---|---|
| `/` | Job listings |
| `/cv-manager` | Import text or fill a form to create a Master CV; inline link editor per CV |
| `/skills` | Skills DB — add/edit/delete categorised skill tags |
| `/forge` | Paste a JD → AI rewrites CV → Before/After score badges → PDF preview + editor + download |
| `/profile` | Global profile settings — auto-fills new CV forms |

## AI provider cascade

All AI calls go through `GeminiClient._generate_json()` with automatic fallback on 429/503 errors:

```
gemini-2.5-flash  →  gemini-2.5-flash-lite  →  groq/llama-3.3-70b-versatile
(15 RPM free)         (30 RPM free)              (30 RPM free, needs GROQ_API_KEY)
```

## Running tests

```bash
cd apps/api
.venv\Scripts\python.exe -m pytest tests/ -v
```

## API endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | DB connectivity check |
| `POST` | `/cv/import` | Import raw CV text (AI-cleaned) |
| `POST` | `/cv/create` | Create CV from structured form (no AI) |
| `GET` | `/cv/` | List all Master CVs |
| `GET` | `/cv/{id}` | Get a single Master CV |
| `PUT` | `/cv/{id}/links` | Update GitHub / portfolio URLs for a CV |
| `POST` | `/cv/forge` | Run the forge loop — returns tailored CV + scores |
| `DELETE` | `/cv/{id}` | Delete a Master CV |
| `GET` | `/jobs/` | List job listings |
| `GET` | `/jobs/{id}` | Get job detail |
| `GET` | `/skills/` | List skills |
| `POST` | `/skills/` | Create skill category |
| `PUT` | `/skills/{id}` | Update skill category |
| `DELETE` | `/skills/{id}` | Delete skill category |
| `GET` | `/profile/` | Get user profile |
| `PUT` | `/profile/` | Update user profile |

Interactive docs available at `http://localhost:8000/docs` while the API is running.
