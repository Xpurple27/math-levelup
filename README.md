# LevelUP Math

An Indonesian learning MVP for UTBK preparation. Built from the supplied handoff in `docs/handoff/`. The working checkout is `Xpurple27/math-levelup`; the handoff's repository name is a reference, not a reason to create another remote.

## Run

Requires **Node.js 24+** (built-in SQLite), npm, and a writable persistent filesystem. Local SQLite development requires no external service or secret. For Vercel and online persistence, follow [the Supabase deployment guide](docs/deployment.md).

```sh
cd /workspace/math-levelup
npm ci --cache /workspace/.npm-cache
npm run dev
```

Open the development server on port 3000 in a local development setup. Create a new account using a test-only password. Accounts, hashed passwords, sessions, frozen attempts, answers, and progress persist in `.data/levelup.sqlite`. `LEVELUP_DATA_DIR` overrides that directory. Never commit the database or `.env.local`.

## Implemented slice

- Registration/login, logout, education level, and target UTBK score.
- 15-question diagnostic covering seven subtopics with five items per PK/PM/PU section, a server-owned 30-minute deadline, autosave, resume, expiry finalization, and immutable completion.
- Initial skill profile with correct/incorrect/unanswered counts and strengths/weaknesses. This is **not** an estimated UTBK score.
- Seven concept modules: ratios, linear equations, means/data interpretation, percentages, geometry, probability/counting, and sequences. Each includes recognition, first step, worked example, and common mistakes.
- Guided practice: 2 Basic + 2 Medium + 2 Hard questions, hint on first mistake, one retry, discounted retry evidence.
- Mini assessment: 3 Medium + 2 Hard, no hints/retries/live feedback, 80% pass threshold.
- Practice filtered by PK/PM/PU, subtopic, and Basic/Medium/Hard/Mixed. Mixed sessions support 5/10/15/20 questions; a single level supports 5/10. Fresh questions are prioritized against the last 30 sessions, with review fallback after exhaustion. First answer stays locked.
- Progress, evidence confidence, mastery states, history, and learning streak using Asia/Jakarta days.
- Responsive dashboard and mobile navigation.

The 252 original, generated seed questions (108 existing + 144 added) are pedagogical examples requiring editorial QA before student use. This bank is not comprehensive UTBK coverage or exam calibration.

## Verify

```sh
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Playwright uses `PLAYWRIGHT_CHROMIUM_EXECUTABLE` if set, otherwise system Chromium when available, otherwise its installed browser. Install the browser with `npx playwright install --with-deps chromium`. E2E tests create uniquely named test accounts; they never delete existing data. They check the complete learning loop, mobile navigation, ownership, payload redaction, scoring authority, deadline expiry, and submit idempotency.

For production-mode validation, build then run `npm run start` and set `LEVELUP_E2E_PRODUCTION=1` for E2E. Port 3000 must be free or occupied by this application's intended test server.

## Runtime boundaries

`src/lib/content.ts` and the persistence adapters are server-only. Browser code imports only public topic/module content and scoring labels. Assessment payloads omit answer keys and explanations until finalization. The server validates session ownership, answer choices, deadline, and attempt state. Scores and mastery are recalculated server-side; client-supplied scores and deadlines have no authority. Finalization and mastery writes share a transaction; repeated submission does not duplicate evidence. No public mastery mutation endpoint exists.

## Online deployment

Supabase Auth and the Postgres adapter are now implemented. Follow [docs/deployment.md](docs/deployment.md) to apply the migration, set Vercel environment variables, and configure Auth redirect URLs. The supplied public key is not committed; configure it in environment settings. The server key is required for trusted storage and scoring and must never enter frontend code.

Vercel always selects online persistence and never falls back to SQLite. Local development still defaults to SQLite unless `LEVELUP_BACKEND=supabase`. Existing local user accounts/progress are preserved but not migrated into Supabase automatically.

Local tests verify the migration, access denials, concurrency safeguards, identity adapter behavior, and the existing learning flow. Hosted Supabase writes/authentication and a Vercel deployment still require environment configuration and live verification.

Before broad student use: complete content QA, password recovery, durable rate limits, and broader question coverage. Deferred: commercial tryouts, packages, leaderboards, payments, AI, similar questions, spaced review, weekly snapshots, and achievements.
