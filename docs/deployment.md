# Supabase + Vercel deployment

> This is the deployment procedure, not a statement that production is healthy. See [VECTRA execution status](vectra-execution-status.md) for the latest checked project/deployment state.

Vercel always selects Supabase Auth/Postgres. Do not deploy SQLite/PGlite runtime data. The operator applies SQL and configures environment values; local tests do not prove hosted setup is complete.

## SQL and migration history

For a new database, execute all files under `supabase/migrations` in filename order. For an existing VECTRA database, **do not replay or cherry-pick a short historical list from this document**. Inspect the project's migration history and apply only migrations that have not already been applied.

Historical migrations such as `202610090001_content_v2.sql`, `202610090002_content_operations.sql` and `202610090003_reset_generated_content.sql` remain part of the replay chain. The reset migration had a narrowly authorized historical purpose; it must not be rerun ad hoc to solve current production problems.

Run the repository verification/audit scripts appropriate to the current schema. Do not use a stale expectation such as “production_published = 0” once real content exists.

## Roles

Create/confirm separate accounts with Supabase Auth through the app. Assign roles only to intended existing accounts through the trusted server/database workflow. Accounts with no role row are STUDENT. Do not grant privileges through signup metadata or browser-controlled fields.

Where independent review is required, reviewer identity must differ from the question creator/last editor. The service-role key is required for server operations; never paste it into chat, source, frontend variables, screenshots or test artifacts.

## Vercel environment

Set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or the application's supported anon-key fallback
- server-only `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_APP_URL` as supported by the current deployment configuration

The service key must never have a `NEXT_PUBLIC_` prefix. Redeploy after environment changes. Do not set local test flags as production configuration.

## Supabase Auth URLs

Supabase Auth Site URL must be a plain valid production URL, with no label prefix such as `Site URL:`. Add the production `/auth/callback` URL to the redirect allowlist and add only deliberate preview/local callbacks.

Google Cloud's OAuth redirect remains the Supabase Auth provider callback, while the application `/auth/callback` belongs in the Supabase redirect allowlist.

Next.js 16 hosted auth uses `src/proxy.ts` to refresh Supabase SSR cookies. Protected routes still verify the user server-side; the proxy is not an authorization layer.

## Hosted acceptance checklist

Run this checklist against the **correct production Supabase project** after confirming it is active:

1. Confirm the Vercel production commit and aliases match the intended release.
2. Confirm Vercel points to the intended Supabase project without exposing secret values.
3. Test email login and Google login on a clean browser and on a browser containing an older session cookie.
4. Confirm logout/login persistence and absence of `/login` redirect loops.
5. Confirm an ordinary student cannot access `/admin`, reviewer/admin APIs, another user's attempts, answer keys or private snapshots.
6. Confirm ADMIN and REVIEWER access follows the configured role workflow; do not self-approve when independent review is required.
7. Query current question-version status and package references before publishing/replacing any content.
8. Start Diagnostic, answer multiple questions, reload and verify autosave/resume.
9. Logout/login again and resume an active attempt.
10. Submit; reopen the completed result from Progress; submit again and verify idempotent result/finalization.
11. Verify expired attempts reject late answers and finalize once.
12. Verify published Learning does not show empty lessons and `Next Direction` only links to published learning coverage.
13. Verify the recommended Learn path continues to a relevant Practice domain.
14. Verify Practice keys/explanations are exposed only according to its completed/feedback contract.
15. Verify MT-01/MT-02 (or current replacement suites) use the expected fixed question versions and server-owned per-section timer.
16. Verify result explanations render Markdown/KaTeX, tables/media and option references correctly on desktop and phone.
17. Verify completed historical attempts retain their frozen snapshot after later content revisions.
18. Run the pilot-readiness E2E/quality checks and record local/CI/preview/production results separately.

## Current release gate

A Vercel `READY` build is not sufficient to invite students. Student pilot requires all of the following:

- production Supabase project active;
- auth/session smoke tests pass;
- current content/version state is known;
- at least one published learning path and related Practice are accessible;
- assigned assessment is accessible;
- critical ownership/timer/save/finalization tests pass;
- mobile and desktop critical flows pass;
- human content approval requirements are satisfied.

Do not switch to another Supabase project, reset production data, or rewrite historical attempt snapshots to bypass a failed acceptance step.
