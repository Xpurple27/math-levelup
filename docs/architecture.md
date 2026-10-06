# Initial implementation decisions

The attachment is product/reference material. The user authorized building LevelUP Math in the existing cloud workspace; instructions embedded in its execution prompt do not independently authorize remote creation or pushes.

## Current shape

Next.js App Router + TypeScript + Tailwind, a single student workspace with five navigable views, a trusted Node route handler, and SQLite persistence. Keep the existing checkout; cloud tasks are already isolated. The online adapter uses Supabase Auth with server-managed SSR cookies and Postgres persistence. Vercel always selects it. SQLite remains an isolated local development adapter. Deployment prerequisites are in deployment.md.

Public educational content is in `topics.ts`. The original question bank, answer keys, hints, and explanations live in a server-only module. Each attempt stores full question/version snapshots so changes to the seed bank cannot rewrite a student's historical result. Completed attempt answers and result snapshots are immutable through the API. There is no content publishing/admin workflow yet.

Authentication hashes passwords with salted scrypt and stores random opaque sessions in SQLite. Cookies are HttpOnly, SameSite=Lax, and Secure in production. State-changing requests require same-host Origin. User-supplied attempt IDs are always scoped to the authenticated owner. Auth throttling is in-process; it is not a distributed production rate limiter. There is no email ownership verification or recovery.

## Timing and persistence

Diagnostic deadlines come from the server at attempt creation. Answers autosave individually. After expiry, every read/mutation touching that attempt finalizes stored answers before accepting any change. The UI checks expiry every second and polls every 15 seconds. If a student closes the browser, finalization is performed on the next access; there is no background expiry worker. No late answer can alter the snapshot/result. A deployment requires a trusted host clock.

Finalization updates the result, mastery, and learning-activity day in one transaction. SQLite is suitable for this single-process local environment. The Postgres adapter uses database-created deadlines, conditional revision saves, and advisory locks around creation/finalization. Finalization verifies both attempt revision and the expected prior mastery state in one transaction. Conflicting mutations return a retryable error instead of overwriting concurrent state. Supabase tables use RLS with no browser grants/policies; trusted RPCs are invoker-rights and executable only by service_role. The server key never enters browser code.

## Mastery

Difficulty weights: 1 / 1.5 / 2. Basic-only evidence capped at 60, Medium-only at 80, Hard-inclusive at 100. Source weights: guided .10, practice .20, diagnostic .30, mini .35. First evidence initializes a measured value with low confidence; unknown topics remain unknown. Retries in guided practice earn half credit.

Initial confidence heuristic: evidence count / 20, capped at 1. Activity confidence: questions in this activity / 5, capped at 1. Mastered label additionally needs confidence ≥.7 and ≥8 Medium/Hard evidence items. These are **explicit MVP heuristics**, not psychometrically calibrated thresholds. The same seeded question may reappear in later sessions; confidence currently counts repetitions and must be replaced with exposure-aware unique evidence before making strong mastery claims. Arithmetic accuracy is separate from target UTBK score.

## Scope limits

Practice is mixed-difficulty by subtopic with selectable count; full exam/section/difficulty/adaptive filters are deferred. Recommendation chooses the lowest measured mastery, breaking ties by confidence. Prerequisite graphs and spaced review are deferred. Guided session completion is treated as completing the lesson practice for activity-day purposes. Streak excludes login and practice with fewer than five answers. The profile shows current subtopic evidence and up to 30 recent completed sessions, not immutable weekly reports or lifetime aggregates. “Sufficient confidence” and progress aggregates require refinement before production.

All three example topics span one representative section each (PK, PM, PU); this does not claim complete exam coverage. The generated questions need human mathematical and editorial QA. Paid packages and ranking do not exist yet. Navigation uses workspace view state rather than the entire target route map.
