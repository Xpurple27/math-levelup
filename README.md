# LevelUP Math

A local-first, Indonesian learning MVP for UTBK preparation. Built from the supplied handoff in `docs/handoff/`. The working checkout is `Xpurple27/math-levelup`; the handoff's repository name is a reference, not a reason to create another remote.

## Run

Requires **Node.js 24+** (built-in SQLite), npm, and a writable persistent filesystem. No external service or secret is needed for the local MVP.

```sh
cd /workspace/math-levelup
npm ci --cache /workspace/.npm-cache
npm run dev
```

Open the development server on port 3000 in a local development setup. Create a new account using a test-only password. Accounts, hashed passwords, sessions, frozen attempts, answers, and progress persist in `.data/levelup.sqlite`. `LEVELUP_DATA_DIR` overrides that directory. Never commit the database or `.env.local`.

## Implemented slice

- Registration/login, logout, education level, and target UTBK score.
- 15-question diagnostic with a server-owned 30-minute deadline, autosave, resume, expiry finalization, and immutable completion.
- Initial skill profile with correct/incorrect/unanswered counts and strengths/weaknesses. This is **not** an estimated UTBK score.
- Three concept modules: ratios, linear equations, means/data interpretation. Each includes recognition, first step, worked example, and common mistakes.
- Guided practice: 2 Basic + 2 Medium + 2 Hard questions, hint on first mistake, one retry, discounted retry evidence.
- Mini assessment: 3 Medium + 2 Hard, no hints/retries/live feedback, 80% pass threshold.
- Practice with 5/10/15/20 questions, feedback after an answer, first answer locked.
- Progress, evidence confidence, mastery states, history, and learning streak using Asia/Jakarta days.
- Responsive dashboard and mobile navigation.

The 108 original, generated seed questions are pedagogical examples requiring editorial QA before student use. This bank is not comprehensive UTBK coverage or exam calibration.

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

`src/lib/content.ts` and `store.ts` are server-only. Browser code imports only public topic/module content and scoring labels. Assessment payloads omit answer keys and explanations until finalization. The server validates session ownership, answer choices, deadline, and attempt state. Scores and mastery are recalculated server-side; client-supplied scores and deadlines have no authority. Finalization and mastery writes share a transaction; repeated submission does not duplicate evidence. No public mastery mutation endpoint exists.

## Production work remaining

This is a **working local MVP, not a production Supabase deployment**. The Supabase SSR client baseline is in `src/lib/supabase/server.ts`, but it is not wired to the runtime. Adding Supabase environment variables does not switch persistence or authentication.

Before real student use, replace the SQLite/local identity adapter with Supabase Auth/Postgres, implement and verify RLS/private answer authority and immutable published versions, migrate data explicitly, and add email verification, password recovery, persistent rate limits, content QA, and broader question coverage. Local SQLite cannot be deployed as-is to Vercel's ephemeral/serverless filesystem.

Deferred: commercial tryouts, packages, leaderboards, payments, AI, custom difficulty filters, similar-question generation, spaced review, weekly snapshots, and achievement systems. See `docs/architecture.md` for decisions and exact limitations. Application deployment and the Supabase production integration are separate next steps.
