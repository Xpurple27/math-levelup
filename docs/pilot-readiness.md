# Pilot readiness — LevelUP Math

**Decision: reviewable release candidate; student pilot remains gated by human content QA and hosted verification.** This document distinguishes local evidence from release approval. Use [pilot-release.md](pilot-release.md) for SQL/Vercel prerequisites and [pilot-content.md](pilot-content.md) for the exact 63-question union.

## Pilot scope and approved content

3–5 students: register/confirm/login → diagnostic → strengths/weaknesses and recommendation → Rasio / Linear equations / Percentages Learn → guided retry → mini → five-question Practice → Progress → Package 01 PK/PM/PU → resume/results → feedback.

- Diagnostic: 15 candidates, **0 human-approved**.
- Learning: 26 distinct candidate IDs including practice pool; 18 guided and 15 mini slots, **0 human-approved**. Three existing concept/worked-example modules mathematically checked, human/student clarity review pending.
- Tryout: 60 candidates (20 per section), **0 human-approved**.
- Entire overlapping union: 63 revision-two IDs, all NEEDS_REVIEW; no item marked VALID or REJECTED automatically.

This is not permission to invite students before the review gates pass. No production deployment or hosted SQL execution is claimed.

## Local verification evidence

Run the required commands below and record their actual results. Production local tests use SQLite; migration/RPC/security/replay and confidence backfill are separately exercised in local PostgreSQL through PGlite. The hosted verifier has mock-transport tests for positive and failing storage paths; these are not a hosted smoke.

```sh
npm run format:check
npm run lint
npm run typecheck
npm test
npm run content:qa
npm run pilot:qa
npm run build
LEVELUP_BACKEND=local LEVELUP_E2E_PRODUCTION=1 npm run test:e2e -- tests/e2e/learning.spec.ts
NEXT_PUBLIC_LEVELUP_PILOT_MODE=1 npm run build
LEVELUP_BACKEND=local LEVELUP_E2E_PRODUCTION=1 NEXT_PUBLIC_LEVELUP_PILOT_MODE=1 npm run test:e2e -- tests/e2e/pilot.spec.ts
```

The second build deliberately enables the bounded pilot; a normal build does not constrain random learning selections to reviewed candidates. CI also runs the pilot build/flow separately. Existing cookie trust is retained: loopback API fixtures explicitly replay their own production Secure cookie rather than weakening cookie settings.

Local verification on 8 October 2026: format, lint, typecheck, unit/database, normal/pilot production builds, content QA, pilot QA and critical browser checks were executed. Final results: **78 unit/database tests passed, 11 critical regression E2E tests passed, and one separate full bounded-pilot E2E passed**. Normal and pilot production builds passed. Format, lint, typecheck, content/pilot QA and repository audit passed; audit reported no pattern findings in the available scanned history/working files. All browser tests used local persistence; hosted verification is still outstanding. Automated unit/database coverage includes 78 tests; full bounded pilot flow passed through logout/login with immutable persisted history/mastery. Production local tests cover registration, confirmation UX, ownership, expiry, feedback failure/retry and general-page context. Hosted verifier mock checks cover failure on a storage notice rather than accepting an empty progress fallback.

## Hosted deployment status

Supabase/Vercel credentials and a confirmed test account were absent in this execution environment. A public hosted request was attempted earlier and stopped before HTTP checks completed. Hosted persistence, confirmation callback, report inserts and actual production migration state are **NOT VERIFIED**. The SQL verifier and `npm run verify:hosted -- --learning-smoke` are prepared for the operator; no server keys are embedded and no hosted migration was executed. Do not treat mocked or local PostgreSQL tests as production verification.

## Student testing instructions (after gates pass)

1. Create an account, follow the confirmation email, and log in. Complete the diagnostic with your own reasoning.
2. Explain to the observer what the strengths, weaknesses and recommendation mean.
3. Open the recommended Learn module, read the example, complete guided practice including one retry, then the mini assessment.
4. Try five-question Practice. Inspect Progress and explain the difference between session score and concept mastery.
5. Start Package 01 Pilot RC in PK; answer a few items, refresh, confirm answers/time resume, then submit. Open results, analysis and solutions. Try PM/PU Package 01 when time permits.
6. Report one question issue and one page issue. Log out and log in again; confirm progress/history persist.

Avoid real passwords or other personal details in feedback. Participation and observation notes stay with the organizer; this feature is not a research consent or tracking system.

## Observation checklist

- [ ] Completes diagnostic without technical assistance.
- [ ] Can describe at least one weakness/strength in their own words.
- [ ] Understands why the recommendation was selected.
- [ ] Learn/first step/example helps them approach guided questions.
- [ ] Understands hint, retry and solution explanation.
- [ ] Interprets mastery without assuming an official UTBK prediction.
- [ ] Wants another practice session.
- [ ] Refresh/resume preserves saved answers and does not reset the deadline.
- [ ] Can send a question and a page report; failure does not claim success.
- [ ] Organizer records confusing copy, implausible options and technical blockers.

Use short qualitative notes and the dedicated test/student identifier; do not put credentials or unnecessary personal data into Git.

## Simple success criteria

A majority of the 3–5 participants finish the diagnostic without technical help and can explain their weakness/recommendation. There are no unresolved blocker bugs, resume works, feedback is stored, and no approved pilot item has an obvious key/distractor error. Content corrections receive a new immutable revision and re-review. This small sample does not establish statistical reliability, exam equivalence or psychometric calibration.

## Limitations and remaining gates

Human QA remains the first gate. Confirm hosted migrations, Auth callbacks, persistence, service-role permissions and Vercel commit as the second gate. Package 02 and non-pilot seed questions are not included in content approval. Coverage is limited, difficulty is editorial, confidence/mastery are heuristics, and repeated family variants are correlated. There are no payments, rankings, AI tutor, achievements, admin CMS or adaptive engine. Use fresh pilot accounts: older active sessions deliberately keep their original snapshots even after pilot mode is enabled. Feedback requires login; guest mode was not added. Reports acknowledge the first matching report and have no resolution dashboard. In-process auth throttling is not a distributed production limiter.
