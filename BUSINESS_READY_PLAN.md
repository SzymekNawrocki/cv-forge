# CV Forge — Path to Portfolio-Ready Product

## Status
- ✅ Phase 0 — Foundation cleanup (done 2026-05-28)
- ✅ Phase 1 — Forge core quality (done 2026-05-28)
- ✅ Phase 2 — Production deployability (done 2026-05-29)
- ✅ Phase 3 — UX polish (done 2026-05-29)
- ✅ Phase 4 — Trust & legal (done 2026-05-29)
- ✅ Phase 5 — Distinguishing polish (done 2026-05-29)

See MANUAL_SETUP.md for third-party connections (Google OAuth, Render, Vercel, Sentry, Resend).

---

## Context

CV Forge today is a working personal project: Next.js 16 + FastAPI + Neon, with auth (fastapi-users + Google OAuth), per-user data isolation, a two-strategy forge (`anchored` vs `aggressive`), bounded retry, and `[AI:]` review markers. **FORGE_PLAN.md** is largely implemented.

User's chosen direction:
- **Portfolio showcase first**, with the architecture left clean enough that the same codebase could later add billing.
- **Improve both forge strategies** with shared quality (better extraction, deterministic scoring, robust parsing, fixed review surface).
- **Phased roadmap** so each phase is independently shippable; can stop at any phase boundary.
- **Free model cascade stays** (Groq + OpenRouter free) — operator cost ~$0; constrains us to a few good prompts rather than throwing GPT-4 at the problem.

The intended outcome: a deployed, public-URL product a recruiter can actually try in <2 minutes, with output good enough to pass an ATS sanity check, and code clean enough to point at.

---

## ✅ Phase 0 — Foundation cleanup (done)

- Deleted `apps/api/ai/ollama_client.py` (legacy localhost Ollama client, unused)
- Removed `react-markdown` and `remark-gfm` from `apps/web/package.json`
- Improved error display in forge: parses JSON body for `detail` field, shows `[status] detail`
- Added Retry button to ForgeSetup error banner
- `failed_sections` was already in ForgeReview.tsx — no change needed

---

## ✅ Phase 1 — Forge core quality (done)

1. **Deterministic match score** — `apps/api/domain/cv_logic/match_score.py` with `rapidfuzz` fuzzy matching + synonym table. Removed `MATCH_SCORE_PROMPT` from AI layer. Formula: 100 − 8×missing_critical (cap 80) − 2×missing_nice.
2. **Parallel section forge** — `forge_pipeline.py` uses `asyncio.gather` + `Semaphore(3)`. Forge time: ~10s.
3. **Robust JSON parsing** — `cascade.py` `parse_json()`: direct → fence regex → simpler strip. One JSON-only LLM retry before next model.
4. **Clean CV JSON** — `clean_cv` returns `CleanCVJSON` → `_clean_cv_json_to_form_data()` → `_form_to_markdown()`. Deleted `_normalize_cv_markdown`.
5. **Token observability** — `AICallLog` table, `usage_callback` on `ModelCascade`. `/profile/usage` endpoint.

---

## Phase 2 — Production deployability (~3–5 days)

Gate between "runs on my laptop" and "lives at a URL."

### 2A. Alembic migrations

Replace the dual `ALTER TABLE IF NOT EXISTS` pattern with tracked migration files.

**Steps:**
1. `cd apps/api && .venv/Scripts/pip install alembic`; add `alembic` to `requirements.txt`.
2. `cd apps/api && .venv/Scripts/alembic init alembic` — creates `alembic/` dir + `alembic.ini`.
3. Edit `alembic/env.py`: import `Base` from `db/base.py`, set `target_metadata = Base.metadata`, load `DATABASE_URL` from env (same pattern as `db/base.py`).
4. `alembic revision --autogenerate -m "initial"` — generates `alembic/versions/<hash>_initial.py` from current models.
5. Review the generated migration; fix any column type mismatches (SQLAlchemy sometimes emits `FLOAT` for `Numeric`, etc.).
6. Replace `main.py` lifespan `create_all` + all `ALTER TABLE` blocks with `alembic upgrade head` (run via `subprocess` at startup, or call `command.upgrade(alembic_cfg, "head")` directly — the latter is cleaner).
7. Delete `apps/api/init_db.py`; update `apps/api/package.json` `"init-db"` script to `"echo 'Alembic handles migrations'"` or remove it from `turbo.json` `dependsOn`.
8. Update root `turbo.json`: the `init-db` task can simply be a no-op or removed since `main.py` runs migrations on startup now.

**Files:** `apps/api/alembic/` (new), `apps/api/alembic.ini` (new), `apps/api/main.py`, `apps/api/requirements.txt`, `apps/api/package.json`, root `turbo.json`.

### 2B. Backend deploy on Render

**Files to create:**

`apps/api/Dockerfile`:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

`render.yaml` (project root):
```yaml
services:
  - type: web
    name: cv-forge-api
    runtime: docker
    dockerfilePath: ./apps/api/Dockerfile
    dockerContext: ./apps/api
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: OPENROUTER_API_KEY
        sync: false
      - key: GROQ_API_KEY
        sync: false
      - key: SECRET_KEY
        sync: false
      - key: GOOGLE_CLIENT_ID
        sync: false
      - key: GOOGLE_CLIENT_SECRET
        sync: false
      - key: FRONTEND_URL
        value: https://your-vercel-app.vercel.app
    healthCheckPath: /health
```

Add `GET /health/ai` endpoint in `apps/api/routers/` (or inline in `main.py`): does a single tiny prompt (`"reply with: ok"`) against the cheapest cascade model, returns `{"status": "ok", "model": "<name>"}` or 503 if all models fail. Proves AI reachability separate from DB.

**Files:** `apps/api/Dockerfile` (new), `render.yaml` (new), `apps/api/main.py` or new `apps/api/routers/health.py`.

### 2C. Frontend deploy on Vercel

**Steps:**
1. Add `.env.production` to `.gitignore` (if not already there). `NEXT_PUBLIC_API_URL` must be set in Vercel dashboard — never hardcode.
2. In `apps/web/src/lib/api.ts`, ensure the base URL uses `process.env.NEXT_PUBLIC_API_URL` (with a fallback to `http://localhost:8000` for local dev).
3. Verify `apps/web/src/proxy.ts` rewrites `/api/*` to `NEXT_PUBLIC_API_URL/*` — this is the existing Next.js 16 proxy pattern.
4. In Vercel project settings: set `Root Directory` to `apps/web`, set `Build Command` to `npm run build`, set `Output Directory` to `.next`.

**Files:** `apps/web/src/lib/api.ts` (verify base URL pattern), `apps/web/.env.example` (add `NEXT_PUBLIC_API_URL=http://localhost:8000`).

### 2D. Sentry on both sides

**Backend:**
1. `pip install "sentry-sdk[fastapi]"`, add to `requirements.txt`.
2. In `apps/api/main.py` lifespan (before app creation): `sentry_sdk.init(dsn=os.getenv("SENTRY_DSN"), traces_sample_rate=0.1, environment=os.getenv("ENVIRONMENT", "development"))`.
3. Tag events with user_id: in `apps/api/routers/` base dependency, call `sentry_sdk.set_user({"id": str(current_user.id)})`.

**Frontend:**
1. `cd apps/web && npm install @sentry/nextjs`.
2. Run `npx @sentry/wizard@latest -i nextjs` — this auto-creates `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, and patches `next.config.js`. Review + commit only what the wizard creates.
3. Add `SENTRY_DSN` and `SENTRY_AUTH_TOKEN` to Vercel env vars (wizard provides the DSN; auth token is for source-map upload).

**Files:** `apps/api/requirements.txt`, `apps/api/main.py`, `apps/web/package.json`, `apps/web/sentry.client.config.ts` (new), `apps/web/sentry.server.config.ts` (new), `apps/web/next.config.js`.

### 2E. structlog on backend

Replace `logging.basicConfig` with JSON-structured logs so Render dashboard is queryable.

1. `pip install structlog`, add to `requirements.txt`.
2. In `apps/api/main.py`, replace `logging.basicConfig(level=logging.INFO)` with:
   ```python
   import structlog
   structlog.configure(
       processors=[structlog.processors.JSONRenderer()],
       wrapper_class=structlog.BoundLogger,
       context_class=dict,
       logger_factory=structlog.PrintLoggerFactory(),
   )
   log = structlog.get_logger()
   ```
3. Replace all `print(...)` calls in backend with `log.info(...)` or `log.error(...)`.
4. In `cascade.py` error paths, emit `log.warning("model_failed", model=model, error=str(e))` — these will show as queryable JSON in Render logs.

**Files:** `apps/api/main.py`, `apps/api/requirements.txt`, `apps/api/ai/cascade.py`, `apps/api/services/forge_service.py`.

### 2F. Per-user rate limiting

Replace the IP-based `slowapi` 5/min on `/cv/forge` with a SQL-backed daily quota.

In `apps/api/routers/cv.py`, before the forge handler logic:
```python
# count TailoredCV rows for this user in last 24h
from datetime import datetime, timedelta
cutoff = datetime.utcnow() - timedelta(hours=24)
count = await session.scalar(
    select(func.count()).where(
        TailoredCV.user_id == current_user.id,
        TailoredCV.created_at >= cutoff
    )
)
if count >= 20:
    raise HTTPException(status_code=429, headers={"Retry-After": "3600"}, detail="Daily forge limit reached (20/day). Try again tomorrow.")
```

Remove the `slowapi` IP-rate-limit decorator from `/cv/forge` if present.

**Files:** `apps/api/routers/cv.py`.

**Verification for Phase 2:** Deploy both halves. Sign up with a real Google account (incognito). Run a forge end-to-end. Check Render logs for a JSON line. Trigger a deliberate exception → confirm it appears in Sentry. Spam `/cv/forge` 21 times → 429 on the 21st.

---

## Phase 3 — UX polish for "real product" feel (~3–4 days)

### 3A. Forge progress streaming

Replace the spinner with per-step status. Pattern: `POST /cv/forge` returns a `job_id` immediately; frontend polls `GET /cv/forge/{job_id}` every 800ms.

**Backend:**
1. In `apps/api/main.py` app state, add `app.state.forge_jobs: dict[str, dict] = {}`.
2. In `apps/api/routers/cv.py`, change `POST /cv/forge`:
   - Generate `job_id = str(uuid.uuid4())`.
   - Store `app.state.forge_jobs[job_id] = {"status": "queued", "progress": 0.0}`.
   - Launch `asyncio.create_task(run_forge_task(job_id, ...))` — `run_forge_task` wraps `run_forge()` and updates `app.state.forge_jobs[job_id]` at each phase.
   - Return `{"job_id": job_id}` immediately (202 Accepted).
3. Add `GET /cv/forge/{job_id}` endpoint returning the current `JobState` dict. Returns 404 if not found (expired), 200 with `{"status": "...", "progress": 0.4, "result": null | TailoredCVRead}`.
4. Status values: `"extracting_keywords"`, `"scoring_before"`, `"forging:{section_name}"`, `"scoring_after"`, `"saving"`, `"done"`, `"failed"`.
5. Clean up `app.state.forge_jobs` entries older than 30min in a background task (use `asyncio.create_task` on a simple loop at startup).

**Frontend:**
1. In `apps/web/src/lib/api.ts`, add `forgeCV(data) → Promise<{job_id: string}>` and `pollForgeJob(job_id) → Promise<JobState>`.
2. In `apps/web/src/app/forge/page.tsx` (or `ForgeSetup.tsx`), replace the single loading state with a polling loop: `setInterval(pollForgeJob, 800)` until status is `"done"` or `"failed"`.
3. Show a progress bar (0–100%) and the current status label (e.g., "Forging Work Experience…").

**Files:** `apps/api/routers/cv.py`, `apps/api/services/forge_service.py` (accept status_callback param), `apps/web/src/lib/api.ts`, `apps/web/src/app/forge/page.tsx` or `apps/web/src/components/forge/ForgeSetup.tsx`.

### 3B. Tailored CV history

Already in DB — just routing + UI.

**Backend:**
1. In `apps/api/routers/cv.py`, add `GET /cv/{master_cv_id}/tailored` returning list of `TailoredCVRead` (id, created_at, job_title, before_score, after_score, strategy) for that master CV, ordered by `created_at DESC`.
2. In `apps/api/domain/schemas.py`, add `TailoredCVListItem` (subset of `TailoredCVRead` — no `content_json` to keep payload small).

**Frontend:**
1. New `apps/web/src/app/forge/history/page.tsx` — server component, takes `?cvId=` query param, fetches `GET /cv/{id}/tailored`, renders a table: date, job title, before→after score badges, "View PDF" (links to `/forge?tailoredId=<tid>`), "Delete".
2. Add "History" link on the forge result screen in `ForgeReview.tsx`.

**Files:** `apps/api/routers/cv.py`, `apps/api/domain/schemas.py`, `apps/web/src/app/forge/history/page.tsx` (new).

### 3C. DOCX export

Server-side, from `content_json` (same source as the PDF renderer).

1. `pip install python-docx`, add to `requirements.txt`.
2. New `apps/api/routers/export.py` with `GET /cv/{master_cv_id}/tailored/{tailored_cv_id}/docx`:
   - Load `TailoredCV.content_json` from DB.
   - Build a `docx.Document()`: name as Heading 1, contact block as a table row, each section as Heading 2 + paragraphs/bullets. Mirror the section order from `CVDocument.tsx`.
   - Return `StreamingResponse(io.BytesIO(doc_bytes), media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", headers={"Content-Disposition": "attachment; filename=cv.docx"})`.
3. In `apps/api/main.py`, include the new router.
4. In `apps/web/src/lib/api.ts`, add `downloadDocx(masterId, tailoredId)` that does a `fetch` and triggers `URL.createObjectURL` download.
5. In `apps/web/src/components/forge/ForgeReview.tsx`, add "Download .docx" button next to "Download PDF".

**Files:** `apps/api/routers/export.py` (new), `apps/api/main.py`, `apps/api/requirements.txt`, `apps/web/src/lib/api.ts`, `apps/web/src/components/forge/ForgeReview.tsx`.

### 3D. Job URL paste

Accept a URL in the JD input; server-side fetch + extract text.

1. `pip install readability-lxml`, add to `requirements.txt`.
2. In `apps/api/routers/jobs.py` (or new `apps/api/routers/scrape.py`), add `POST /jobs/scrape` body `{"url": str}`:
   - `httpx.get(url, follow_redirects=True, timeout=10)` with a real User-Agent header.
   - `readability.Document(html).summary()` → strip tags → return `{"text": plain_text, "title": doc.title()}`.
   - If the response is 403/blocked or text < 100 chars, return `{"error": "blocked", "message": "This site blocks scraping. Please paste the job description manually."}` — do NOT raise a 500.
3. In `apps/web/src/app/forge/page.tsx` (or `ForgeSetup.tsx`), add a "Paste URL" button above the JD textarea. On click, show a URL input; on submit, call `/jobs/scrape` and fill the textarea with the returned text. If `error === "blocked"`, show the friendly fallback message inline.

**Files:** `apps/api/routers/jobs.py` or new `scrape.py`, `apps/api/requirements.txt`, `apps/web/src/app/forge/page.tsx` or `ForgeSetup.tsx`.

### 3E. Onboarding flow

First-login redirect to `/onboarding` if user has 0 master CVs.

1. In `apps/web/src/proxy.ts` (or a server-side layout check), after login: fetch `GET /cv/` — if array is empty, `redirect('/onboarding')`.
2. New `apps/web/src/app/onboarding/page.tsx`: 3-step wizard (React state machine, no new route per step):
   - Step 1: Welcome — "CV Forge rewrites your CV for each job listing. Let's get started."
   - Step 2: "Add your CV" — shows two buttons: "Import from text" (→ `/cv-manager?tab=import`) and "Fill in manually" (→ `/cv-manager?tab=form`). Wait for user to land back.
   - Step 3: "Add your skills" — "Skills help forge AI target the right keywords." Button → `/skills`.
3. Track which steps are complete by checking `GET /cv/` and `GET /skills/` response lengths in the onboarding page component.

**Files:** `apps/web/src/app/onboarding/page.tsx` (new), `apps/web/src/proxy.ts` or root layout.

### 3F. Empty-state messaging

Every list page currently shows a blank when data is empty.

In each of these files, add an `EmptyState` component (inline or extracted) that renders when the array is empty:
- `apps/web/src/app/cv-manager/page.tsx` — "No CVs yet. Import your CV or fill it in manually."
- `apps/web/src/app/skills/page.tsx` — "No skills yet. Add a category to help the AI target the right keywords."
- `apps/web/src/app/forge/page.tsx` — "No CV selected. Go to CV Manager to add one."

The `EmptyState` pattern: centered icon-free div, heading, one sentence, one CTA button.

### 3G. Landing page

Replace job listings at `/` with a marketing page.

1. Move job listings to `/jobs` — rename `apps/web/src/app/page.tsx` → `apps/web/src/app/jobs/page.tsx`, update all internal links.
2. New `apps/web/src/app/page.tsx`: static server component. Sections:
   - Hero: "Tailor your CV to any job in 30 seconds." + "Start free →" (→ `/login`).
   - "How it works": 3-step with short labels — Import your CV / Paste the job description / Download the tailored PDF.
   - Screenshot or animated GIF of the forge result.
   - Footer: links to `/privacy`, `/terms`, GitHub repo.
3. No new npm deps — use Tailwind CSS only. No carousels, no JS animations.

**Files:** `apps/web/src/app/page.tsx` (rewrite), `apps/web/src/app/jobs/page.tsx` (new, moved content), update any `href="/"` nav links that mean "job list" → `href="/jobs"`.

**Verification for Phase 3:** Walk through as a first-time user. Time-to-first-forge from landing: <3 min. Export both PDF + DOCX from the same tailored CV, open in Word, confirm formatting. Paste a company careers page URL — text should fill the JD box. Paste a LinkedIn URL — should show the "blocked" fallback message.

---

## Phase 4 — Trust & legal (~2–3 days)

Required if EU users can sign up — with Google OAuth public, they will.

### 4A. Privacy Policy + Terms

1. Go to **termly.io** (free tier) or **privacypolicies.com**, generate a policy customized for:
   - Data collected: email, name (from Google OAuth), CV content, job descriptions, AI-generated text.
   - Where stored: Neon DB (verify it's on an EU region — `eu-central-1` or `eu-west-2`).
   - Retention: until user deletes their account.
   - Data processors: Vercel (frontend hosting), Render (API hosting), Neon (database), Groq (AI), OpenRouter (AI), Google (OAuth provider), Sentry (error monitoring).
2. Download the generated HTML, paste into:
   - `apps/web/src/app/privacy/page.tsx` — server component, render with `dangerouslySetInnerHTML` or convert to JSX.
   - `apps/web/src/app/terms/page.tsx` — same pattern.
3. Add links to both in the landing page footer and the account settings page.

**Files:** `apps/web/src/app/privacy/page.tsx` (new), `apps/web/src/app/terms/page.tsx` (new).

### 4B. GDPR data export

1. In `apps/api/routers/me.py` (new), add `GET /me/data`:
   - Query all rows owned by `current_user.id`: `UserProfile`, `MasterCV[]`, `JobDescription[]`, `TailoredCV[]`, `Skill[]`, `AICallLog[]`.
   - Build a ZIP in memory: `zipfile.ZipFile(buf, "w")` with one JSON file per table (`profile.json`, `cvs.json`, etc.).
   - `TailoredCV.content_json` included in full (it's their own data).
   - Return `StreamingResponse(buf, media_type="application/zip", headers={"Content-Disposition": "attachment; filename=my-data.zip"})`.
2. Include the router in `apps/api/main.py`.
3. Add a "Download my data" button in `apps/web/src/app/settings/page.tsx` that fetches `/me/data` and triggers a download.

**Files:** `apps/api/routers/me.py` (new), `apps/api/main.py`, `apps/web/src/app/settings/page.tsx`.

### 4C. GDPR data deletion

1. In `apps/api/db/models.py`, add `ondelete="CASCADE"` to all FK columns that reference `user_profiles.id` (or whatever the PK is on `UserProfile`). This ensures DB-level cascade on `DELETE`.
2. Generate an Alembic migration for the FK changes: `alembic revision --autogenerate -m "add_ondelete_cascade"`. Review + commit.
3. In `apps/api/routers/me.py`, add `DELETE /me`:
   - Delete `UserProfile` row for `current_user.id` — cascade deletes all other rows.
   - Delete the fastapi-users auth user record (call the user manager's `delete` method).
   - Return 204 No Content.
4. In `apps/web/src/app/settings/page.tsx`, add a "Delete my account" button with a confirmation modal. On confirm, call `DELETE /me`, then `signOut()` and redirect to `/`.

**Files:** `apps/api/db/models.py`, `apps/api/routers/me.py`, `apps/web/src/app/settings/page.tsx`.

### 4D. Cookie banner

Minimal banner — no third-party trackers, so no CMP needed.

1. New `apps/web/src/components/CookieBanner.tsx` (`"use client"`):
   - Shows on first visit if no `cookie_consent` localStorage key exists.
   - Text: "We use a session cookie for authentication only. No tracking cookies."
   - One button: "OK" — sets `localStorage.setItem("cookie_consent", "true")` and hides banner.
2. Import and render in `apps/web/src/app/layout.tsx`.

**Files:** `apps/web/src/components/CookieBanner.tsx` (new), `apps/web/src/app/layout.tsx`.

### 4E. Account settings page

Consolidate user-facing account actions.

In `apps/web/src/app/settings/page.tsx`, add a new "Account" section (below AI model selector, above usage widget):
- Email (read-only, from UserProfile).
- "Download my data" → `GET /me/data`.
- "Delete account" → `DELETE /me` + confirm modal.

**Verification for Phase 4:** Sign up a throwaway test user. Add CVs/skills/forge once. Hit "Download my data" — inspect ZIP, confirm all tables are present. Hit "Delete account". Re-query DB directly: `SELECT COUNT(*) FROM master_cvs WHERE user_id = '<id>'` — should be 0.

---

## Phase 5 — Distinguishing polish (~optional, 2–3 days)

### 5A. Second CV template ("Pure ATS")

Add a single-column, no-icons Helvetica template.

1. In `apps/web/src/components/CVDocument.tsx`, extract the current template into `apps/web/src/components/cv-templates/TwoColumnTemplate.tsx`.
2. Create `apps/web/src/components/cv-templates/ATSTemplate.tsx`: single column, `fontFamily: "Helvetica"` (built into @react-pdf/renderer — no custom font needed), no boxes, plain text section headers with thin rule.
3. In `apps/web/src/components/CVViewer.tsx`, accept a `template: "two-column" | "ats"` prop; render the matching template component.
4. In `apps/web/src/app/forge/page.tsx`, add a template toggle (two buttons: "Designer" / "ATS Safe") stored in local state and passed to `CVViewer`.

**Files:** `apps/web/src/components/CVDocument.tsx` (extract), `apps/web/src/components/cv-templates/TwoColumnTemplate.tsx` (new), `apps/web/src/components/cv-templates/ATSTemplate.tsx` (new), `apps/web/src/components/CVViewer.tsx`, `apps/web/src/app/forge/page.tsx`.

### 5B. Bundle/perf pass

1. Run `cd apps/web && npm run build` and check the route tree output — confirm `@react-pdf/renderer` is NOT in the initial bundle (it should only appear in `CVViewer`'s lazy chunk since it's `dynamic(..., {ssr:false})`).
2. If it leaks, trace the import chain. The fix is almost always moving an import into the dynamically-loaded component.
3. Run `next build --profile` (add `--profile` flag to build script temporarily) and inspect `apps/web/.next/analyze/` if `@next/bundle-analyzer` is configured.
4. The Roboto font files (`apps/web/public/fonts/`) should be ~300KB total after subsetting. If larger, re-subset with `fonttools` keeping only `latin` + `latin-ext` glyphs.

**Files:** `apps/web/src/components/CVViewer.tsx` (check imports), `apps/web/next.config.js` (add bundle-analyzer if needed).

### 5C. Light/dark theme

Tailwind CSS v4 makes this essentially free.

1. In `apps/web/tailwind.config.ts`, confirm `darkMode: "class"` is set.
2. In `apps/web/src/app/layout.tsx`, read a `theme` cookie (or localStorage via a `"use client"` wrapper) and apply `class="dark"` to `<html>` when dark.
3. In `apps/web/src/app/settings/page.tsx`, add a "Theme" toggle (Light / Dark / System). On change, set the cookie + toggle the class.
4. Add `dark:` variants to the main layout, nav, cards, and inputs. Start with `bg-white dark:bg-zinc-900` and `text-zinc-900 dark:text-zinc-100` — most of the app already uses neutral colors.

**Files:** `apps/web/tailwind.config.ts`, `apps/web/src/app/layout.tsx`, `apps/web/src/app/settings/page.tsx`, various page/component files for `dark:` variants.

### 5D. Open Graph card

For nice link unfurls when shared.

1. In `apps/web/src/app/layout.tsx` (or `page.tsx` for the landing), add:
   ```tsx
   export const metadata = {
     openGraph: {
       title: "CV Forge — AI CV Tailoring",
       description: "Tailor your CV to any job in 30 seconds.",
       images: ["/og.png"],
     },
   };
   ```
2. Create `apps/web/public/og.png` — a 1200×630 PNG with the value prop. Use Figma or Canva; no code needed.
3. Verify with `https://opengraph.xyz/` (paste the deployed URL).

**Files:** `apps/web/src/app/layout.tsx`, `apps/web/public/og.png` (new asset).

---

## Manual Steps — Things You Must Do Yourself

These require clicking through third-party UIs or running one-time commands that cannot be scripted.

### M1. Google OAuth credentials (required for Phase 2)

1. Go to **[console.cloud.google.com](https://console.cloud.google.com)**.
2. Create a new project named "CV Forge" (or reuse your existing one if you already have Google OAuth working locally).
3. Enable the **Google People API** (APIs & Services → Library → search "People API" → Enable).
4. Go to **APIs & Services → OAuth Consent Screen**:
   - User type: **External**.
   - App name: `CV Forge`, support email: `devnawrocki@gmail.com`.
   - Scopes: add `openid`, `email`, `profile`.
   - Test users: add your own email for testing before verification.
5. Go to **APIs & Services → Credentials → Create Credentials → OAuth Client ID**:
   - Application type: **Web application**.
   - Name: `CV Forge Web`.
   - Authorized redirect URIs:
     - `http://localhost:8000/auth/google/callback` (local)
     - `https://your-render-service.onrender.com/auth/google/callback` (production — fill in after Render deploy)
6. Copy **Client ID** and **Client Secret** → paste into `apps/api/.env` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Also add these to Render environment variables (M3 below).
7. When you're ready to go public: return to OAuth Consent Screen → **Publish App** (moves from testing to production; Google may email you but no manual approval needed for basic scopes).

### M2. Neon DB — verify EU region (recommended before Phase 2)

1. Go to **[console.neon.tech](https://console.neon.tech)** → your project → Settings → General.
2. Check the **Region**. For GDPR compliance (Phase 4), it should be `eu-central-1` (Frankfurt) or `eu-west-2` (London). If it's currently `us-east-1`, you need to create a new project in an EU region and migrate data:
   - `pg_dump $OLD_DATABASE_URL | psql $NEW_DATABASE_URL`
   - Update `DATABASE_URL` in `apps/api/.env` and in Render.
3. If already in an EU region, no action needed.

### M3. Render — deploy the backend (Phase 2)

1. Go to **[render.com](https://render.com)** → New → Web Service.
2. Connect your GitHub repo. Set **Root directory** to `apps/api`, **Dockerfile path** to `./apps/api/Dockerfile`.
3. In **Environment Variables**, add:
   - `DATABASE_URL` — from Neon DB dashboard (the pooled connection string).
   - `OPENROUTER_API_KEY` — from openrouter.ai → Keys.
   - `GROQ_API_KEY` — from console.groq.com → API Keys.
   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` — from M1.
   - `SECRET_KEY` — generate a random 32-char string: `python -c "import secrets; print(secrets.token_hex(32))"`.
   - `ENVIRONMENT` = `production`.
   - `SENTRY_DSN` — from M5 below.
   - `FRONTEND_URL` — your Vercel URL (can update after M4).
4. Set **Health Check Path** to `/health`.
5. Deploy. Once it's live, copy the `onrender.com` URL and add it to Google OAuth redirect URIs (M1, step 5).

### M4. Vercel — deploy the frontend (Phase 2)

1. Go to **[vercel.com](https://vercel.com)** → New Project → Import from GitHub.
2. Set **Root Directory** to `apps/web`.
3. In **Environment Variables** (Settings → Environment Variables):
   - `NEXT_PUBLIC_API_URL` = `https://your-render-service.onrender.com` (from M3).
   - `SENTRY_DSN` — frontend DSN from M5.
   - `SENTRY_AUTH_TOKEN` — from M5 (for source map uploads; optional but recommended).
4. Deploy. Copy the `vercel.app` URL and update `FRONTEND_URL` in Render (M3) + the Google OAuth consent screen's authorized origins.

### M5. Sentry — create two projects (Phase 2)

1. Go to **[sentry.io](https://sentry.io)** → Create Organization (or use existing) → name it "CV Forge".
2. Create **Project 1**: Platform = **FastAPI**, name = `cv-forge-api`. Copy the DSN.
3. Create **Project 2**: Platform = **Next.js**, name = `cv-forge-web`. Copy the DSN + generate an **Auth Token** (Settings → Auth Tokens → Create) with `project:write` and `org:read` scopes.
4. Paste DSNs into:
   - Render environment variables: `SENTRY_DSN` = backend DSN.
   - Vercel environment variables: `SENTRY_DSN` = frontend DSN, `SENTRY_AUTH_TOKEN` = token from step 3.
5. The `@sentry/wizard` (Phase 2D) will also ask for the DSN — use the frontend one when running it in `apps/web`.

### M6. Privacy Policy + Terms generation (Phase 4)

1. Go to **[termly.io](https://termly.io)** (free plan is sufficient) or **[privacypolicies.com](https://www.privacypolicies.com)**.
2. Select "Privacy Policy" → answer the questions:
   - Website URL: your Vercel URL.
   - Business contact: `devnawrocki@gmail.com`.
   - Data collected: email, name (Google OAuth), CV content, usage logs.
   - Third-party services: Google (OAuth), Vercel (hosting), Render (API hosting), Neon (database), Groq (AI), OpenRouter (AI), Sentry (error monitoring).
   - Data location: EU (after completing M2).
   - Retention: until account deletion.
3. Generate, download as HTML.
4. Repeat for "Terms of Service" — this is simpler; the key clause is "This is a CV-assistance tool. We do not guarantee employment outcomes."
5. Paste HTML into the page components (Phase 4A).

### M7. Custom domain (optional, after Phase 2)

If you want `cvforge.app` or similar instead of `vercel.app`:
1. Buy a domain at Namecheap, Cloudflare Registrar, or similar.
2. In Vercel → Project → Settings → Domains → Add Domain. Vercel will give you DNS records.
3. In Render → Service → Settings → Custom Domains → Add. Render provides a CNAME.
4. Update `FRONTEND_URL` in Render env vars, and `NEXT_PUBLIC_API_URL` in Vercel env vars to use the new domains.
5. Update Google OAuth redirect URIs (M1) to include the new domain callbacks.

---

## Critical files (cumulative across phases)

Backend touch points:
- `apps/api/alembic/` (new) — replace manual migrations
- `apps/api/Dockerfile` (new) — Render deploy
- `apps/api/main.py` — Sentry init, structlog config, alembic startup, per-user rate limit
- `apps/api/ai/cascade.py` — structlog
- `apps/api/db/models.py` — `ondelete="CASCADE"` on FKs
- `apps/api/routers/cv.py` — job polling endpoints, per-user rate limit, history endpoint
- `apps/api/routers/export.py` (new) — DOCX
- `apps/api/routers/me.py` (new) — `/me/data`, `DELETE /me`
- `apps/api/routers/health.py` or `main.py` — `/health/ai`
- `apps/api/requirements.txt` — alembic, sentry-sdk, structlog, python-docx, readability-lxml
- `render.yaml` (new, project root) — Render service config

Frontend touch points:
- `apps/web/src/app/page.tsx` — replace job listings with landing
- `apps/web/src/app/jobs/page.tsx` (new) — moved job listings
- `apps/web/src/app/onboarding/page.tsx` (new)
- `apps/web/src/app/forge/history/page.tsx` (new)
- `apps/web/src/app/privacy/page.tsx`, `terms/page.tsx` (new)
- `apps/web/src/app/settings/page.tsx` — account section, usage widget, theme toggle
- `apps/web/src/components/CookieBanner.tsx` (new)
- `apps/web/src/components/cv-templates/` (new dir) — template split
- `apps/web/src/lib/api.ts` — forgeJob polling, getMyData, deleteMe, downloadDocx
- `apps/web/src/app/layout.tsx` — dark mode class, CookieBanner, OG metadata
- `apps/web/package.json` — add @sentry/nextjs, @sentry/wizard

---

## Sequencing & exit ramps

Phases are ordered so each one ships independently.

- **Stop after Phase 1** (already done) — the forge actually works well, locally.
- **Stop after Phase 2** — live URL you can put on your CV, monitored, rate-limited.
- **Stop after Phase 3** — feels like a product: polished UX, history, DOCX, landing page.
- **Phase 4** is required if you expect any EU users (Google OAuth = yes).
- **Phase 5** is visual polish — do it last or not at all.

Estimated remaining: ~8–12 days of focused work for Phases 2–4.

---

## End-to-end verification (after each phase)

1. `npm run dev` from root.
2. Sign in with a fresh Google account (or test user).
3. Import a real CV via raw text.
4. Add 3–5 skill categories.
5. Open `/forge`, paste a real JD, forge in **anchored** mode, then **aggressive** mode. Compare scores.
6. Verify: `[AI:]` markers render amber in preview; Edit tab live-updates PDF; failed_sections banner appears if you force a section to fail.
7. Download PDF, download DOCX (Phase 3+), open both in Word/Reader.
8. Hit "Download my data" (Phase 4+), inspect ZIP.
9. Delete account, re-query DB, confirm zero rows remain.
10. After Phase 2: open the deployed URL in incognito, repeat steps 2–7.

Backend unit tests stay green throughout: `apps/api/.venv/Scripts/python.exe -m pytest tests/ -v`.
Frontend type-check: `cd apps/web && npm run type-check`.
