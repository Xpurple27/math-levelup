# Validation — 6 October 2026

Verified in this cloud instance with Node.js 24.19.0, npm 11.9.0, Next.js 16.3.8, and system Chromium.

- Frozen dependency reinstall: `npm ci --cache /workspace/.npm-cache --no-audit --no-fund` passed.
- Prettier, ESLint, and TypeScript checks passed.
- Vitest: 8 tests passed for question assignments, active payload redaction, correct/incorrect/unanswered grading, evidence caps, retry discount, source weighting, and confidence labels.
- Production build passed.
- Playwright on production runtime: 4 tests passed. Full learning loop plus reload/resume and logout/login; mobile layout/navigation; assessment ownership and authority; expired timer rejects late changes and repeat submission does not duplicate mastery.
- Development-mode critical flow, mobile navigation, ownership, and timer checks were also verified.
- Private seeded stems were absent from browser chunks. Server-only imports enforce the content boundary.

The API-only production fixtures explicitly replay their own session cookie on loopback because Playwright's API cookie transport treats Secure cookies differently from the browser. The full browser flow verifies actual production login/session behavior. No cookies or passwords are logged.

No Supabase database, RLS, pgTAP, remote CI execution, push, application deployment, environment publication, or fresh-task snapshot restoration was tested or claimed. See architecture.md for local-runtime and content limitations.

## Supabase/Vercel integration revision

- 15 tests passed: 8 scoring/content, 3 PostgreSQL migration/permission/concurrency, 4 mocked Supabase identity/confirmation/backend-selection tests.
- Format, lint, TypeScript, and production build passed.
- The 4 browser tests passed after the async adapter refactor in both local development and local production runtime.
- A production server launched with `VERCEL=1` and an intentionally local backend setting selected Supabase and created no SQLite directory. Public homepage remained available with missing online configuration.
- Direct read-only Supabase Auth settings access was denied by the cloud egress proxy (HTTP CONNECT 403). The project domain and server-key requirement were saved in the environment draft. No hosted SQL was executed and no real Supabase account was created by these checks.
- Live Supabase persistence and a Vercel deployment remain unverified until the migration, credentials, network policy, and Auth redirects are applied. Local database tests and mocked Auth tests do not establish hosted readiness.
