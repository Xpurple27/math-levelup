# Stabilization scope

C1–C4 preserves the student engine and replaces its content source with normalized published versions. See [architecture](architecture.md) for frozen snapshots/ownership/scoring contracts and [content V2](content-architecture-v2.md) for authoring security and lifecycle.

General CI checks formatting, lint, types, unit/database tests and production build. Critical E2E uses isolated TEST_ONLY storage and covers student registration/resume/result plus admin draft/KaTeX/QA/publication/import. Pure engine tests retain adapter parity, ownership, deadlines, optimistic revisions, atomic finalization, mastery confidence and replayable migrations. There is no pilot mode, generated registry or source-bank QA script in the active system.

Remaining release prerequisites are hosted SQL/environment/role setup, live Supabase/Vercel acceptance and human-curated published content with enough coverage. No hosted success is implied by local validation. Full Learning/Tryout Builder and external import/integration features are intentionally deferred.
