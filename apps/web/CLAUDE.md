@AGENTS.md

# Web App — Frontend Guidelines

See root `CLAUDE.md` for hardware constraints and full stack rules. This file covers frontend-specific guidance only.

## Stack

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4
- Data from FastAPI running at `http://localhost:8000`

## Data Fetching

- Server Components: use `fetch` directly with `cache: 'no-store'` for live job data.
- Client Components: use SWR or React Query for polling/mutation — do not use `useEffect` + `fetch` manually.
- Wrap all FastAPI calls in `src/lib/api.ts` with typed return values. Never inline fetch URLs in components.

## Component Rules

- Keep Client Components (`'use client'`) at the leaf level — push interactivity down, not up.
- No `useEffect` for data fetching. No client-side routing for initial data loads.
- Tailwind only — no CSS modules, no styled-components.

## Testing

- Vitest + React Testing Library for component logic.
- Write tests before implementing non-trivial components (job card filtering, status badge logic).
- Do not test Tailwind class names; test behavior and accessibility.

## File Conventions

```
src/
├── app/                     ← Route segments (App Router)
├── components/              ← Shared UI components
└── lib/
    └── api.ts               ← All FastAPI fetch wrappers (typed)
```
