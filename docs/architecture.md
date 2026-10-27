# Runtime architecture

> Current operational state and production blockers are tracked in [VECTRA execution status](vectra-execution-status.md). This document describes architecture/contracts; historical package inventory claims should not be treated as live production status.

The application uses Next.js App Router, React and TypeScript. Vercel always selects Supabase Auth/Postgres; local development defaults to SQLite for Auth/attempts and PGlite/Postgres for normalized content. `LEVELUP_BACKEND=supabase` selects the hosted adapter locally. Runtime databases are never bundled or committed.

`src/lib/store.ts` is the storage facade; local/hosted adapters retain matching ownership, revision and finalization rules. `src/features/auth` handles validated identity. `src/features/assessment/actions.ts` selects current published normalized questions and creates frozen trusted snapshots. The schema/runtime/authoring boundary is detailed in [content architecture V2](content-architecture-v2.md).

Hosted Supabase Auth uses `@supabase/ssr`. On Next.js 16, `src/proxy.ts` refreshes the Supabase session cookies for server-rendered requests while protected routes continue to verify identity through the existing server-side user checks. The proxy refresh is session plumbing, not an authorization substitute.

## Assessment contracts

Snapshots contain question identity/version and all information needed to finish an attempt, including private keys/explanations. Browser payloads omit those until completion or the existing guided-feedback condition. Future content edits do not mutate stored snapshots.

The server owns timed deadlines, validates user ownership, option bounds and active state, and uses optimistic revision checks for writes. Diagnostic timing is server-defined. Tryout timing is read from the published `tryout_packages.duration_seconds` row for the selected fixed package/section. Timed expired attempts finalize automatically. Answer keys, client scores, client deadlines and mastery values supplied in requests have no authority. Practice locks the first answer; guided sessions allow a hint after the first error and one discounted retry. Finalization, mastery and qualifying activity writes share a transaction and are idempotent.

Diagnostic selection requires published normalized questions that satisfy its section/difficulty quotas. Practice and tryout packages use fixed published question versions rather than exposing answer keys during active attempts. Current MT-01/MT-02 inventory is a database concern and must be verified against the live backend; see [content review status](content-review-status.md).

Mastery uses unique answered logical question IDs and weighted difficulty evidence. Repeated questions/versions do not inflate confidence; historical evidence rebuilding remains in the adapters. Jakarta day boundaries govern activity and streaks. Finalization groups the frozen snapshot's topic IDs, allowing normalized UUID taxonomy instead of a hardcoded seed list.

`mastery.value` and `confidence` are rules-based product indicators. Confidence measures the amount/diversity of unique evidence; it is not a statistical probability. Session score is percent correct for that session; neither value is an official UTBK score prediction.

## Learning direction

Published learning modules are linked to normalized subtopics. A recommendation requires an active taxonomy chain, published module with readable published lessons, a runnable FREE practice package containing that subtopic, and the existing reassessment quota (3 Medium + 2 Hard). No completed test can manufacture missing content. `readableLearning` filters incomplete modules; `resolveQuestionSet` requires every pinned version to be current and published, without duplicate logical IDs. Package references are fetched in batches rather than one request per package.

When a covered subtopic is selected:

1. Learn opens the module attached to that subtopic.
2. The final lesson can continue to Practice.
3. Practice selects a FREE package whose actual question coverage includes the lesson’s subtopic.
4. Practice result offers a targeted mini reassessment only where its quota exists. New items are prioritized; frozen snapshots record exposure in the owner’s last 30 sessions. The result reports repeats.
5. Completed Practice/Assessment attempts contribute evidence through the existing mastery engine.
6. Progress can reopen completed attempts using the stored frozen snapshot.

If a published learning path is not available, the UI must state that clearly instead of fabricating a recommendation.

## Authoring and feedback

Admin layouts/APIs authenticate existing sessions and query trusted `levelup_roles`; browser metadata does not establish privilege. Mutations require same-origin requests and bounded bodies. Private PostgreSQL RPCs independently enforce ADMIN/REVIEWER permissions; browser roles cannot read normalized tables, keys or snapshots. Published content is immutable, review must be independent and import confirms drafts only.

Contextual reports retain ownership checks, server-derived attempt/question/version metadata, bounded message validation and duplicate prevention. Page feedback accepts active normalized subtopic UUIDs and historical seed contexts; question feedback references the frozen attempt rather than client-supplied keys.

The shared Markdown renderer disables raw HTML, sanitizes content and runs KaTeX with trust disabled. Student active media excludes EXPLANATION-role assets; do not put answer-bearing media in stimulus/question assets. Storage references are Supabase object paths rather than hotlinked provenance URLs.

## Test boundaries

Pure engine fixtures are test-only. Browser fixtures use a unique temporary data directory and marked TEST_ONLY normalized questions; Vercel cannot enable them. Database tests replay the migration chain and exercise role/grant denial, version immutability, key validity, QA/import and existing transactional engine contracts. CI separates general validation from Chromium-based critical flows.

Local/CI success proves the code/fixture contract, not production database health. Production acceptance requires the correct Supabase project to be active and is recorded separately in [VECTRA execution status](vectra-execution-status.md).

## Evidence interpretation

A session with no answers does not update mastery. In a partially answered skill, blanks contribute zero credit to session evidence and remain in its denominator. Repeated IDs can change mastery through the existing moving average, but unique evidence count does not grow. Across versions, confidence retains the highest difficulty weight observed for each answered logical ID. See the exact equations in [execution status](vectra-execution-status.md).

Suite summaries in browser storage are scoped to the authenticated user ID and are conveniences, not authoritative cross-device assessment records. Legacy unscoped summaries are not imported into another account. Completed server attempts remain authoritative. Reading a lesson is not yet a persisted server-side completion event; pilot observers record that milestone manually.
