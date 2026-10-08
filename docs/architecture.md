# Runtime architecture

The application uses Next.js App Router, React and TypeScript. Vercel always selects Supabase Auth/Postgres; local development defaults to SQLite for Auth/attempts and PGlite/Postgres for normalized content. `LEVELUP_BACKEND=supabase` selects the hosted adapter locally. Runtime databases are never bundled or committed.

`src/lib/store.ts` is the storage facade; local/hosted adapters retain matching ownership, revision and finalization rules. `src/features/auth` handles validated identity. `src/features/assessment/actions.ts` selects current published normalized questions and creates frozen trusted snapshots. The schema/runtime/authoring boundary is detailed in [content architecture V2](content-architecture-v2.md).

## Assessment contracts

Snapshots contain question identity/version and all information needed to finish an attempt, including private keys/explanations. Browser payloads omit those until completion or the existing guided-feedback condition. Future content edits do not mutate stored snapshots.

The server owns diagnostic/mini/tryout deadlines (30/10/20 minutes), validates user ownership, option bounds and active state, and uses optimistic revision checks for writes. Timed expired attempts finalize automatically. Answer keys, client scores, client deadlines and mastery values supplied in requests have no authority. Practice locks the first answer; guided sessions allow a hint after the first error and one discounted retry. Finalization, mastery and qualifying activity writes share a transaction and are idempotent.

Diagnostic selection needs five published questions each in PK/PM/PU: PK/PM use 2 Basic + 2 Medium + 1 Hard, PU uses 1 Basic + 2 Medium + 2 Hard. Guided selection needs two per difficulty; mini needs three Medium and two Hard. Practice quotas and fresh-question priority remain, now against published normalized content. The empty tryout catalog prevents creation of legacy package sessions. Historical unrelated attempts retain their frozen snapshot/deadline. The specifically authorized obsolete generated-content history reset is described in [content reset](content-reset.md).

Mastery uses unique answered logical question IDs and weighted difficulty evidence. Repeated questions/versions do not inflate confidence; historical evidence rebuilding remains in the adapters. Jakarta day boundaries govern activity and streaks. Finalization groups the frozen snapshot's topic IDs, allowing normalized UUID taxonomy instead of a hardcoded seed list.

## Authoring and feedback

Admin layouts/APIs authenticate existing sessions and query trusted `levelup_roles`; browser metadata does not establish privilege. Mutations require same-origin requests and bounded bodies. Private PostgreSQL RPCs independently enforce ADMIN/REVIEWER permissions; browser roles cannot read normalized tables, keys or snapshots. Published content is immutable, review must be independent and import confirms drafts only.

Contextual reports retain ownership checks, server-derived attempt/question/version metadata, bounded message validation and duplicate prevention. Page feedback accepts active normalized subtopic UUIDs and historical seed contexts; question feedback references the frozen attempt rather than client-supplied keys.

The shared Markdown renderer disables raw HTML, sanitizes content and runs KaTeX with trust disabled. Student active media excludes EXPLANATION-role assets; do not put answer-bearing media in stimulus/question assets. Storage references are Supabase object paths rather than hotlinked provenance URLs.

## Test boundaries

Pure engine fixtures are test-only. Browser fixtures use a unique temporary data directory and marked TEST_ONLY normalized questions; Vercel cannot enable them. Database tests replay the migration chain and exercise role/grant denial, version immutability, key validity, QA/import and existing transactional engine contracts. CI separates general validation from Chromium-based critical flows.
