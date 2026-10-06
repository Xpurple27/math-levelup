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

## Expanded question bank and practice filters

- 252 unique question IDs/stems across seven topics, each with 12 items per difficulty.
- 144 new answer keys checked against independently worked numeric grids.
- 20 unit/database tests passed, including fresh-first sampling, review fallback, difficulty/count constraints, and the seven-topic diagnostic with five items per section.
- Production build, TypeScript, ESLint, and formatting checks passed.
- Browser checks cover the original loop, mobile navigation, authority/expiry, and the new search/filter/fresh-first/resume flow on local persistence. Hosted Supabase behavior remains subject to the earlier deployment prerequisites.
- No database migration was added; the current snapshot/history schema supports the expansion. Existing question records remain unchanged and previously created attempts retain their frozen content.

## MVP stabilization — 7 October 2026

- No new product features or questions; the bank remains 252. The UI/API were split into domain modules with the same endpoints/layout and learning flow.
- Format, ESLint (no warnings), TypeScript and production build passed.
- 57 unit/database tests passed, including a shared SQLite/production Postgres RPC contract, legacy confidence backfill/replay, lifetime unique evidence, actual Supabase RPC conflict handling, and QA/secret scanner checks.
- 10 Playwright tests passed on the production runtime with local persistence, including both fixed packages and a new repeated-tryout confidence/redaction regression.
- Content QA tooling passed: 0 VALID, 252 NEEDS_REVIEW, 0 REJECTED; 0 exact duplicate groups and 56 numeric-normalized similarity groups. Aggregate distractor review flags 171 minimum keys / 0 maximum keys, including all 144 additional questions having the minimum numeric answer. This remains a content-quality blocker for unsupervised student assessments.
- Repository scan of 118 historical blobs available before this release plus commit-eligible working files found no flagged private material; the scanner does not print matching values and is not a comprehensive proof of secret/PII absence.
- GitHub API visibility read was denied (Forbidden). Repository visibility was not changed; private is recommended because source contains keys.
- Hosted SQL/Auth/Vercel behavior and GitHub Actions runner execution were not verified. A new Supabase migration is supplied for user execution, not applied remotely by these tests. See stabilization.md for rollout and user-testing conditions.
