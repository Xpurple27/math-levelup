# VECTRA Math

**Know Your Direction.**

VECTRA Math is a learning & assessment platform for UTBK preparation. It helps students understand their current position, identify learning gaps, get a recommended next direction, practice deliberately, and measure progress with evidence.

Core product loop:

**Diagnostic → Learning Profile → Recommended Learning → Learn → Practice → Assessment → Progress ↗**

The application keeps answer keys server-side, freezes completed attempts, tracks mastery/confidence evidence, and uses normalized content authoring with explicit publishing workflows.

## Current milestone

Target: **“Vectra — satu alur belajar terverifikasi dan siap uji coba.”**

Use [VECTRA execution status](docs/vectra-execution-status.md) as the current operational source of truth. It distinguishes confirmed runtime evidence, historical observations, blockers, and work that still requires a live backend or human review.

Pilot and portfolio artifacts:

- [Student pilot protocol](docs/student-pilot-protocol.md)
- [MT-01 / MT-02 content review status](docs/content-review-status.md)
- [Portfolio case study](docs/vectra-case-study.md)
- [60–90 second demo script](docs/demo-script.md)
- [Premium package blueprint](docs/premium-blueprint.md)

## Run locally

Node.js 24+, npm, and a writable persistent filesystem:

```sh
npm ci
npm run dev
```

Auth/attempts use `.data/levelup.sqlite`; normalized content uses `.data/content-pg` (PGlite). The `LEVELUP_*` environment/storage identifiers are intentionally retained as **internal compatibility names** so the rebrand does not change runtime or persisted data. Override local storage through `LEVELUP_DATA_DIR`. Never commit databases or `.env.local`.

Register local accounts, stop the server, then grant roles when needed:

```sh
npm run admin:grant -- admin@example.com ADMIN
npm run admin:grant -- reviewer@example.com REVIEWER
npm run dev
```

There is no default admin account. Signup metadata cannot grant privileges.

## Product surfaces

- `/` — VECTRA public landing page
- `/login`, `/register` — authentication
- `/app` — student learning intelligence workspace
- `/admin` — VECTRA Content Studio
- `/reviewer` — quality-control workspace

Student navigation is intentionally compact: **Home · Learn · Practice · Assessment · Progress**.

## Content and engine

- Independent exam/section and domain/topic/subtopic taxonomies.
- Logical questions and immutable published versions; normalized options, Explanation V2, provenance and media references.
- Draft/QA/publish workflow for curated content.
- Markdown/KaTeX shared by student questions, completed explanations and admin previews.
- Excel import, media references, Learning Builder, Practice Package Builder, curated Practice inventory, and timed assessment flows.
- Preserved Supabase Auth, server-owned timer, autosave/resume, frozen attempts, grading, mastery/confidence evidence, guided retry rules, and contextual reports.
- VECTRA branding is presentation-only; mastery, recommendation, assessment, database, and authentication logic remain independent of the brand layer.

Read [content architecture](docs/content-architecture-v2.md), [Excel instructions](docs/content-import.md), [engine architecture](docs/architecture.md), [UTBK content master](docs/utbk-content-master-2026.md), and [deployment](docs/deployment.md).

## Interpreting VECTRA indicators

`Mastery` and `Confidence` are internal evidence indicators implemented with explicit weighting rules. They are **not** psychometrically calibrated ability estimates, statistical probabilities, or official UTBK score predictions. See [VECTRA execution status](docs/vectra-execution-status.md) and `src/lib/scoring.ts` for the current implementation contract.

## Brand system

Primary identity:

- Brand: **VECTRA**
- Product: **VECTRA Math**
- Tagline: **Know Your Direction.**
- Philosophy: **Position → Direction → Progress ↗**
- Navy: `#0B1020`
- Blue: `#5C7CFA`
- Turquoise: `#00D1B2`
- Lime: `#B7FF3C`

Public URL is configurable through `NEXT_PUBLIC_SITE_URL` (or `NEXT_PUBLIC_APP_URL`); do not hardcode a future VECTRA domain into application code.

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

The `LEVELUP_E2E_PRODUCTION` name is also retained for internal compatibility. E2E runs use isolated TEST_ONLY fixtures and must never mutate production data.

Vercel always uses Supabase Auth/Postgres and never the local fallback. Apply migrations and server-only configuration using the deployment guide. Never expose `SUPABASE_SERVICE_ROLE_KEY` or publicize frozen assessment snapshots.

## Verified milestone status — 27 October 2026

The full learning loop is verified **locally** at desktop/mobile sizes with TEST_ONLY data, including login/resume and result reopening. Production Supabase is healthy on recheck, but a complete published content path and independent review evidence are still missing. Student pilot has not started; this is not a production-readiness claim.

- [Current execution status](docs/vectra-execution-status.md)
- [Validation evidence](docs/validation-current.md)
- [Content/version review](docs/content-review-status.md)
- [Pilot protocol and blank recording template](docs/student-pilot-protocol.md)
- [Case study](docs/vectra-case-study.md), [60–90 second demo](docs/demo-script.md), [three premium packages blueprint](docs/premium-blueprint.md)

For read-only production inventory use `supabase/verify-vectra-readiness.sql`. Content exports can be checked with `node scripts/audit-content-export.mjs input.json report.json`; keep answer-bearing exports out of browser assets and public evidence. The structural report is not independent mathematical approval.
