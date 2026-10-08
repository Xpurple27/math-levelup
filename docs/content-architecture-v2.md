# Content architecture V2 — C1–C4

The student engine remains: Auth, server-owned attempts/deadlines, autosave/resume, frozen snapshots, scoring, mastery confidence, feedback and backend selection. Content now comes from normalized PostgreSQL tables. There are **zero production questions** in this release's seeds. Classification seeds are labels, not learning modules or approved exam content.

## Schema

- `exams → exam_sections` describes exam structure.
- `domains → topics → subtopics` describes mathematical knowledge independently of exam sections. A subtopic can appear in several sections.
- `questions` is a logical identity with stable UUID/code and current version pointer. `question_versions` contains classification, difficulty, Markdown and provenance references. `(question_id, version_number)` is unique.
- `question_options` stores A–E options and the private answer key; `question_explanations` stores Understanding, Known, Asked, Concept, First Step, Solution, Final Answer, Shortcut, Common Mistake and Option Analysis.
- `content_sources` records source type/title, publisher/year/file/reference URL/notes; versions retain source/page references.
- `media_assets` records existing Supabase Storage objects with original name, MIME, bytes, dimensions, alt text and provenance. `question_media` connects version/media/role/order. Register `bucket/path`, never a Google Drive hotlink. This phase links existing objects; it does not upload or transform assets. Student images require a public content bucket. Keep answer-bearing images private and out of active question media.
- `learning_modules`, `learning_lessons`, `lesson_blocks`, `lesson_question_assignments` are schema foundations only. No Learning Builder or thin seed lessons.
- `content_reviews` supports question versions, modules, lessons and future assessment revisions. Current application QA is for question versions only.
- `import_jobs` and `import_rows` persist upload/validation/results. See [import instructions](content-import.md).

## Versioning and lifecycle

`DRAFT → IN_REVIEW → QA_PASSED → PUBLISHED`. Rejected/changes-requested reviews return the version to DRAFT. Approval requires notes and all seven checks: mathematics, key, wording, difficulty, taxonomy, explanation and distractors. Reviewer must differ from creator and last editor. Approval does not publish; an ADMIN performs publication separately.

Publication requires 4–5 distinct options, exactly one correct answer, an active classification chain and complete Understanding/Concept/First Step/Solution/Final Answer. Database triggers reject multiple correct options even in drafts. Zero options/key is allowed while drafting, never for QA/publication.

Published versions and their options/explanation/media relations cannot be updated or deleted, including direct SQL writes. Create Revision copies content into a new DRAFT. The current published pointer remains unchanged while a revision is prepared. Student runtime selects only current PUBLISHED versions of ACTIVE logical questions and active taxonomy. Archiving the logical question removes it from new sessions; frozen attempt snapshots remain usable. Delete Draft removes only unpublished draft versions, and removes logical identity only when no version remains.

Editor saves require the loaded `updated_at` token; stale saves fail instead of overwriting another editor. Draft identity is unique and current pointers must belong to the same logical question. Frozen snapshots pin UUID, version number/version UUID, question content, key and explanation server-side; subsequent publishing never changes an existing attempt.

## Permissions

`levelup_roles` contains trusted STUDENT/ADMIN/REVIEWER assignments. Accounts without a row default to STUDENT. Signup metadata and request-supplied user IDs do not assign privileges.

- STUDENT cannot read authoring APIs, tables, answer keys or unpublished content.
- ADMIN creates/edits drafts, creates revisions, registers media, imports, sends QA, publishes and archives. An independent ADMIN may review.
- REVIEWER reads bank/previews and completes QA; cannot author, import, publish, archive or delete.

Layouts verify authenticated identity on the server. Mutation routes require a matching Origin and bounded bodies. Every privileged RPC rechecks the verified actor's role. All normalized tables use RLS with no browser policies/grants; private functions/views are service-role-only. The service key remains server-only. Student responses redact keys/explanations/hints until completion or the existing guided-feedback condition. Raw HTML is disabled; shared ReactMarkdown/KaTeX renders inline `$...$` and display `$$...$$`, sanitizes input and disables trusted KaTeX commands.

## Local and hosted operation

Local Auth/attempts remain SQLite; normalized content uses persistent PGlite under `LEVELUP_DATA_DIR/content-pg`. Migrations are applied once through a ledger. Stop the local server before running `npm run admin:grant -- existing-email ADMIN` (and REVIEWER for a second existing account).

Vercel always selects Supabase; no local fallback or test-fixture enablement. Apply the three `20261009000*` migrations after the historical chain, then assign roles using operator SQL described in [deployment](deployment.md). `LEVELUP_TEST_MODE=1` only enables explicitly TEST_ONLY fixtures in local test storage; production queries exclude them.

## Phase boundary

Question Bank supports search and exam/section/domain/topic/subtopic/difficulty/status/source filters and pagination. Editor supports structured drafts, Markdown/LaTeX, preview, media references, revision history and controlled lifecycle. `/admin/qa`, `/admin/media`, `/admin/imports` provide the minimal required workflows. Learning and tryout builders, PDF/Drive import, payment, leaderboards, tutor/adaptive features are out of scope. Empty learning/tryout views are intentional.
