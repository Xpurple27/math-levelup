# LevelUP Math

UTBK learning engine with normalized content authoring, independent QA and Excel import. Repository: `Xpurple27/math-levelup`. This C1–C4 release removes the former generated bank/packages/thin learning content and starts with **zero published production questions**. Student accounts and the assessment engine remain; curated content can be drafted, reviewed and published through `/admin`.

## Run locally

Node.js 24+, npm and writable persistent filesystem:

```sh
npm ci
npm run dev
```

Auth/attempts use `.data/levelup.sqlite`; normalized content uses `.data/content-pg` (PGlite). Override both through `LEVELUP_DATA_DIR`. Never commit databases or `.env.local`. Register two local accounts, stop the server, then grant roles:

```sh
npm run admin:grant -- admin@example.com ADMIN
npm run admin:grant -- reviewer@example.com REVIEWER
npm run dev
```

There is no default admin account. Signup metadata cannot grant privileges. Open `/admin/questions` for bank/editor, `/admin/qa` for independent review, `/admin/imports` for the template/preview/confirmed draft workflow and `/admin/media` to link existing Supabase Storage objects.

## Content and engine

- Independent exam/section and domain/topic/subtopic taxonomies.
- Logical questions and immutable published versions; normalized options, Explanation V2, provenance and media references.
- DRAFT → IN_REVIEW → QA_PASSED → explicit PUBLISHED; role checks in server routes and private database RPCs.
- Markdown/KaTeX shared by student questions, completed explanations and admin previews.
- Bounded Excel import, persisted row errors/preview, atomic confirmation into DRAFT only.
- Preserved Auth, server-owned timer, autosave/resume, frozen attempts, grading/mastery confidence, guided retry rules and contextual reports.
- Empty learning/tryout views until separately curated content/builders are implemented. New sessions need enough published questions for the existing diagnostic/practice quotas.

Read [content architecture](docs/content-architecture-v2.md), [Excel instructions](docs/content-import.md), [reset decisions](docs/content-reset.md), [engine architecture](docs/architecture.md) and [deployment](docs/deployment.md).

## Verify

```sh
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
LEVELUP_E2E_PRODUCTION=1 npm run test:e2e
npm run audit:repository
```

Install Chromium with `npx playwright install --with-deps chromium` if needed. E2E runs in isolated temporary storage with TEST_ONLY fixtures, never production data. Port 3000 must be free; the runner does not reuse another server. Default CI checks format/lint/types/unit/build; the critical E2E workflow covers engine, admin, import and relevant renderer changes.

Vercel always uses Supabase Auth/Postgres and never local fallback. Apply migrations and server-only configuration using the deployment guide. Hosted Auth/write/deployment verification still needs operator execution. No full Learning/Tryout Builder, PDF/Drive import, payment, leaderboard or AI/adaptive features are included.
