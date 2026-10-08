# Content reset — C1

This release intentionally removes the former generated production bank (252 questions), Package 01/02/Pilot RC manifests/question sets, pilot mode/QA registries and generated thin learning content. Obsolete content QA scripts, pilot hosted verifier and old seed-specific tests/docs are removed. Empty production content is valid: no new bank or auto-approved production questions are generated.

The Auth/users/sessions, attempts, timer, autosave/resume, server grading, mastery confidence, feedback tables/security boundaries, CI and online/local backend abstraction remain. Assessment selection now reads published normalized versions and finalization derives topics from frozen snapshots. Student views clearly show unpublished learning/tryout content. These compatibility changes preserve the engine rather than replacing it.

## Data cleanup

`202610090003_reset_generated_content.sql` deletes only attempts whose frozen snapshots match obsolete generated IDs (`rasio|aljabar|statistika-N` or additional-topic `-fN-vN` IDs). Related attempt reports cascade. For affected owners, obsolete seven-topic mastery is removed; activity is cleared only when no attempt remains. Auth users/profiles and unrelated attempts/history remain. A matching one-time SQLite cleanup uses a `local_migrations` ledger and removes dependent reports before deleting retired attempts.

This is the authorized reset of obsolete test/history content. Review the migration and take an operator backup before hosted execution. It does not truncate Auth or arbitrary learner data. If an external deployment used different generated IDs, inspect those separately rather than broadening cleanup blindly.

## Migration decisions

Keep all historical migrations, including package timing migrations and confidence/reports: a clean database must replay the entire chain, and existing deployments need reproducible upgrades. Historical migration definitions are not active content seeds. The new reset migration replaces package-specific attempt creation rules; application routes reject new tryout sessions while the active package catalog is empty. Surviving frozen snapshots/deadlines are not recalculated.

Added migrations in order:

1. `202610090001_content_v2.sql`: normalized schema, taxonomy labels, RLS/grants, integrity/immutability/publication guards.
2. `202610090002_content_operations.sql`: role-aware authoring/QA/import RPCs and published-only runtime query.
3. `202610090003_reset_generated_content.sql`: targeted history reset, generic trusted timer RPC and UUID taxonomy feedback support.

Neither schema migration seeds questions, lessons, packages or approvals. SQL verification is `supabase/verify-content-v2.sql`. Hosted execution remains an operator task; local tests do not prove hosted migrations have run.

## Test isolation

Pure engine fixtures live under `tests/fixtures`, never imported into runtime. Browser tests create a unique temporary SQLite/PGlite directory and explicitly TEST_ONLY published questions. The fixture runner refuses Vercel, forces local persistence and closes bootstrap storage before starting the app. Production runtime excludes TEST_ONLY even if an environment flag is accidentally present on Vercel. Template examples are SKIPPED. No test credential is a production account.

Scope ends after C1–C4; no content-generation sprint or full learning/tryout builder follows automatically.
