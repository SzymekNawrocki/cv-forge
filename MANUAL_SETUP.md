# CV Forge — Manual Setup Instructions

Everything Claude cannot do for you: connecting third-party services, setting env vars in cloud dashboards, creating assets.

---

## M1. Google OAuth credentials

**When:** Required before the app works for login. Set up before deploying to Render.

1. Go to [console.cloud.google.com](https://console.cloud.google.com).
2. Create a project named **CV Forge** (or reuse an existing one).
3. Enable the **Google People API**: APIs & Services → Library → search "People API" → Enable.
4. Go to **APIs & Services → OAuth Consent Screen**:
   - User type: **External**
   - App name: `CV Forge`, support email: `devnawrocki@gmail.com`
   - Scopes: `openid`, `email`, `profile`
   - Test users: add your own email for testing
5. Go to **Credentials → Create Credentials → OAuth Client ID**:
   - Application type: **Web application**
   - Name: `CV Forge Web`
   - Authorized redirect URIs:
     - `http://localhost:8000/auth/google/callback` (local dev)
     - `https://your-render-service.onrender.com/auth/google/callback` (add after M3)
6. Copy **Client ID** and **Client Secret** → add to `apps/api/.env`:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```
7. Also add these to Render environment variables (M3).
8. When going public: OAuth Consent Screen → **Publish App**.

---

## M2. Neon DB — verify EU region (GDPR)

**When:** Before going live with EU users.

1. Go to [console.neon.tech](https://console.neon.tech) → your project → Settings → General.
2. Check the **Region**. For GDPR compliance, it should be `eu-central-1` (Frankfurt) or `eu-west-2` (London).
3. If it's `us-east-1`, migrate:
   ```powershell
   # Create new Neon project in eu-central-1 first, then:
   pg_dump $OLD_DATABASE_URL | psql $NEW_DATABASE_URL
   ```
4. Update `DATABASE_URL` in `apps/api/.env` and in Render env vars.

---

## M3. Render — deploy the backend

**When:** After M1 and M2.

1. Go to [render.com](https://render.com) → **New → Web Service**.
2. Connect your GitHub repo.
3. Set:
   - **Root directory:** `apps/api`
   - **Dockerfile path:** `./apps/api/Dockerfile` (or let Render auto-detect)
   - **Docker context:** `./apps/api`
4. In **Environment Variables**, add all of these:

   | Key | Value / Source |
   |---|---|
   | `DATABASE_URL` | Neon pooled connection string (from Neon dashboard) |
   | `OPENROUTER_API_KEY` | From [openrouter.ai](https://openrouter.ai) → Keys |
   | `GROQ_API_KEY` | From [console.groq.com](https://console.groq.com) → API Keys |
   | `JWT_SECRET` | Run: `py -c "import secrets; print(secrets.token_hex(32))"` |
   | `GOOGLE_CLIENT_ID` | From M1 |
   | `GOOGLE_CLIENT_SECRET` | From M1 |
   | `RESEND_API_KEY` | From [resend.com](https://resend.com) → API Keys (for email verification) |
   | `SENTRY_DSN` | From M5 (backend DSN) |
   | `ENVIRONMENT` | `production` |
   | `FRONTEND_URL` | Your Vercel URL (fill in after M4, then update) |
   | `ALLOWED_ORIGINS` | Your Vercel URL, e.g. `https://cv-forge.vercel.app` |
   | `COOKIE_SECURE` | `true` |
   | `COOKIE_SAMESITE` | `none` (required for cross-domain cookie with Vercel) |

5. Set **Health Check Path** to `/health`.
6. Deploy. Copy the `onrender.com` URL and:
   - Add it to Google OAuth redirect URIs (M1 step 5)
   - Set it as `FRONTEND_URL` → actually set to the Vercel URL, not Render

---

## M4. Vercel — deploy the frontend

**When:** After M3 (you need the Render API URL).

1. Go to [vercel.com](https://vercel.com) → **New Project → Import from GitHub**.
2. Set **Root Directory** to `apps/web`.
3. In **Environment Variables** (Settings → Environment Variables), add:

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://your-render-service.onrender.com` |
   | `SENTRY_DSN` | From M5 (frontend DSN) |
   | `SENTRY_AUTH_TOKEN` | From M5 (for source map uploads) |

4. Deploy. Copy the `vercel.app` URL and:
   - Update `FRONTEND_URL` in Render (M3) to this URL
   - Update `ALLOWED_ORIGINS` in Render to this URL
   - Add `https://your-vercel-app.vercel.app` to Google OAuth authorized origins (M1)

---

## M5. Sentry — create two projects

**When:** Before deploying (needed for M3 and M4 env vars).

1. Go to [sentry.io](https://sentry.io) → Create Organization → name it **CV Forge**.
2. Create **Project 1**:
   - Platform: **FastAPI**
   - Name: `cv-forge-api`
   - Copy the **DSN** → use as `SENTRY_DSN` in Render (M3)
3. Create **Project 2**:
   - Platform: **Next.js**
   - Name: `cv-forge-web`
   - Copy the **DSN** → use as `SENTRY_DSN` in Vercel (M4)
   - Go to Settings → Auth Tokens → Create token with `project:write` + `org:read` scopes
   - Copy token → use as `SENTRY_AUTH_TOKEN` in Vercel (M4)

---

## M6. Privacy Policy + Terms — generate content

**When:** Before going live with EU users (Phase 4A).

The pages at `/privacy` and `/terms` already exist with placeholder content. Replace the body text with a real generated policy:

1. Go to [termly.io](https://termly.io) (free plan) or [privacypolicies.com](https://www.privacypolicies.com).
2. Generate a **Privacy Policy** with:
   - Website URL: your Vercel URL
   - Business contact: `devnawrocki@gmail.com`
   - Data collected: email, name (Google OAuth), CV content, usage logs
   - Third-party services: Google (OAuth), Vercel, Render, Neon, Groq, OpenRouter, Sentry
   - Data location: EU (`eu-central-1`, Frankfurt)
   - Retention: until account deletion
3. Generate **Terms of Service** — key clause: "This is a CV-assistance tool. We do not guarantee employment outcomes."
4. Copy the generated text into `apps/web/src/app/privacy/page.tsx` and `apps/web/src/app/terms/page.tsx` (replace the current placeholder sections with the real text, or use `dangerouslySetInnerHTML` with the generated HTML).

---

## M7. Open Graph image

**When:** Before going live (for social media sharing previews).

1. Create a `1200 × 630 px` PNG in **Figma** or **Canva**.
2. Content suggestion: dark background (#0D0D0E), "CV Forge" in large Barlow Condensed, tagline "Tailor your CV to any job in 30 seconds.", forge logo.
3. Save as `apps/web/public/og.png`.
4. The `layout.tsx` already references `/og.png` in the OG metadata.
5. Verify the unfurl at [opengraph.xyz](https://opengraph.xyz/) after deploying.

---

## M8. Custom domain (optional)

**When:** After Phase 2 is deployed and working.

1. Buy a domain at Namecheap, Cloudflare Registrar, or similar. Suggested: `cvforge.app`.
2. In **Vercel → Project → Settings → Domains** → Add Domain. Follow DNS instructions.
3. In **Render → Service → Settings → Custom Domains** → Add. Use the provided CNAME.
4. Update env vars:
   - `FRONTEND_URL` in Render → your custom domain
   - `ALLOWED_ORIGINS` in Render → your custom domain
   - `NEXT_PUBLIC_API_URL` in Vercel → your Render custom domain
5. Add the new domain to Google OAuth authorized redirect URIs and origins (M1).

---

## M9. Resend — email verification setup

**When:** Required for email/password registration flow. Google OAuth works without it.

1. Go to [resend.com](https://resend.com) → Sign up.
2. Go to **API Keys** → Create API Key → copy it → add to `RESEND_API_KEY` in `.env` and Render.
3. Go to **Domains** → Add your domain (e.g. `cvforge.app`) → follow DNS verification.
4. Without a verified domain, Resend will only send to the account owner's email (fine for testing).
5. Update the "from" email in `apps/api/auth/manager.py` to use your domain once verified.

---

## M10. Final end-to-end verification checklist

After completing M1–M5:

- [ ] Open the Vercel URL in incognito
- [ ] Click "Sign in with Google" — authenticates successfully
- [ ] You land at the landing page `/`
- [ ] Click "Start free →" → redirected to login (already logged in, goes to forge)
- [ ] Go to `/cv-manager` → import a real CV
- [ ] Go to `/skills` → add 2–3 skill categories
- [ ] Go to `/forge` → paste a real job description → Forge
- [ ] Forge completes (~10–30s) → score badges appear
- [ ] Download PDF — opens correctly
- [ ] Download .docx — opens in Word, formatting intact
- [ ] Go to `/settings` → "Download my data" → ZIP downloads with JSON files
- [ ] Paste a job URL in forge URL input → text fills the JD box
- [ ] Check Render logs → JSON lines appear (structlog)
- [ ] Trigger a test error → check Sentry dashboard

---

## Local dev `.env` template

Create `apps/api/.env` with:

```env
DATABASE_URL=postgresql://...@...neon.tech/neondb?sslmode=require
OPENROUTER_API_KEY=sk-or-...
GROQ_API_KEY=gsk_...
JWT_SECRET=<32-char random hex>
GOOGLE_CLIENT_ID=....apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
RESEND_API_KEY=re_...

# Optional (no-op when unset)
SENTRY_DSN=
ENVIRONMENT=development
```

Generate JWT_SECRET locally:
```powershell
py -c "import secrets; print(secrets.token_hex(32))"
```
