# Validation

Run `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, then `LEVELUP_E2E_PRODUCTION=1 npm run test:e2e` and `npm run audit:repository`.

Database tests replay the SQL chain and exercise browser access denial, role enforcement, independent QA, publication/version immutability, single-key/unique-version/taxonomy constraints, draft deletion, import validation/atomic draft confirmation and idempotency. Existing engine tests retain scoring/mastery, SQLite/Postgres parity, optimistic revisions, ownership, timer expiry and trusted auth/storage boundaries. Excel tests parse the actual template and reject duplicate/invalid/missing/formula input.

Critical browser tests use isolated local Auth/normalized TEST_ONLY data to verify registration, autosave/resume/results, student admin denial and manual draft/KaTeX/independent QA/explicit publication/Excel drafts. The fixture runner never mutates hosted Supabase or production storage. Hosted verification is separate: [deployment checklist](deployment.md) and `supabase/verify-content-v2.sql`.

The intentionally empty production bank is not a testing failure; human authoring/QA and sufficient published coverage are required before student learning sessions are ready.

## C1–C4 validation result

Local validation completed: format/lint/typecheck and production build passed; 52 unit/database tests across 11 files passed; all 7 production-mode browser tests passed. Repository pattern audit found no private-material findings after reviewing the exact public npm deprecation contact. SQL migrations replay locally and the targeted reset preserves Auth/unrelated history. Hosted migration execution and live Supabase/Vercel acceptance have not been performed by this task.
