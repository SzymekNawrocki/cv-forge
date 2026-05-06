# CV Forge — CLAUDE.md

## Project Mission
A precision AI tool for Entry-level candidates to survive the job market. It takes a "Master CV" (Markdown) and a specific Job Description, then uses local AI (Ollama) to surgically rewrite CV sections to maximize ATS compatibility and professional impact.

## ⚠️ HARDWARE CONSTRAINTS (8GB RAM)
- **Ollama REST API only**: Use `http://localhost:11434`. No heavy LLM frameworks (LangChain/LlamaIndex).
- **Models**: `qwen2.5-coder:3b` (primary for rewriting), `llama3.2:1b` (for analysis).
- **Memory Management**: Process CV sections sequentially. Avoid large in-memory objects.

## 🗄️ Tech Stack & Database
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4.
- **Backend**: FastAPI (Python 3.11+), `httpx` for async calls.
- **Database**: **Neon DB (PostgreSQL)**.
- **Database URL**: Stored as `DATABASE_URL` in `.env`.
- **ORM/Driver**: `SQLAlchemy` (Async) with `asyncpg`.

## Core Workflow (The "Forge" Loop)
1. **Input**: User pastes a Job Description (JD) and selects a Master CV.
2. **Analysis**: AI (1b model) extracts keywords from JD and identifies gaps.
3. **Ghostwrite**: AI (3b model) rewrites Summary and Experience sections based on JD.
4. **Review**: Side-by-side Markdown editor in Next.js.
5. **Export**: Tailored Markdown ready for PDF conversion.

## Backend Architecture (`apps/api`)
apps/api/
├── main.py            ← FastAPI entry point
├── db/
│   ├── base.py        ← SQLAlchemy async engine & session factory
│   └── models.py      ← PostgreSQL schemas (master_cvs, tailored_cvs, job_descriptions)
├── domain/
│   ├── cv_logic/      ← Markdown parsing & section management
│   └── schemas.py     ← Pydantic models for API validation
├── services/
│   └── forge_service.py ← Orchestration: JD Analysis -> CV Tailoring
├── ai/
│   ├── prompts.py     ← Section-specific templates for Qwen 3B
│   └── client.py      ← Async Ollama HTTP client
└── .env               ← DATABASE_URL and OLLAMA_BASE_URL


## Development Rules
- **TDD First**: Write tests for Markdown parsing and AI response validation.
- **Database**: Use migrations (Alembic) or simple `create_all` for initial setup.
- **JSON Only**: All Ollama prompts must enforce `format: "json"`.
- **Single Process**: If RAM is tight, run backend and frontend in separate terminals.

## Agent Skills
- Focus on clean, modular Python code.
- Prioritize type safety in TypeScript (Frontend).
- Follow Clean Architecture: Routers -> Services -> Domain/DB.