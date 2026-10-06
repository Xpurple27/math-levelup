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

Difficulty weights: 1 / 1.5 / 2. Basic-only evidence capped at 60, Medium-only at 80, Hard-inclusive at 100. Source weights: guided .10, practice .20, diagnostic .30, mini .35, tryout .35. First evidence initializes a measured value with low confidence; unknown topics remain unknown. Retries in guided practice earn half credit.

Initial confidence heuristic: evidence count / 20, capped at 1. Activity confidence: questions in this activity / 5, capped at 1. Mastered label additionally needs confidence ≥.7 and ≥8 Medium/Hard evidence items. These are **explicit MVP heuristics**, not psychometrically calibrated thresholds. The same seeded question may reappear in later sessions; confidence currently counts repetitions and must be replaced with exposure-aware unique evidence before making strong mastery claims. Arithmetic accuracy is separate from target UTBK score.

## Scope limits

Practice supports section-based topic filtering, subtopic choice, Basic/Medium/Hard/Mixed difficulty, and count. Adaptive selection remains deferred. New sessions shuffle candidates and prefer IDs absent from the owner’s last 30 sessions, then fall back to review when needed. Mixed sessions include all three difficulty levels. Guided practice and mini-assessment retain their specified compositions. Recommendation chooses the lowest measured mastery, breaking ties by confidence. Prerequisite graphs and spaced review are deferred. Guided session completion is treated as completing the lesson practice for activity-day purposes. Streak excludes login and practice with fewer than five answers. The profile shows current subtopic evidence and up to 30 recent completed sessions, not immutable weekly reports or lifetime aggregates. “Sufficient confidence” and progress aggregates require refinement before production.

Seven example subtopics span PK/PM/PU, with the diagnostic allocating exactly five items to each section; this does not claim complete exam coverage. The generated questions need human mathematical and editorial QA. Paid packages and ranking do not exist yet. Navigation uses workspace view state rather than the entire target route map.

## Content expansion

252 seed questions: the original 108 records retain their IDs/content/versions; 144 additional records cover percentages, geometry, probability/counting, and sequences. The added bank uses 48 problem families, each with three parameter variants. Each of the seven topics has 12 Basic, 12 Medium, and 12 Hard questions. New diagnostic sessions cover all seven topics in 15 items. Existing active sessions resume their frozen snapshot rather than being rebuilt. No SQL migration is needed for this expansion: the existing snapshots and attempt history already store the necessary data.

Difficulty labels are initial editorial judgments, not calibrated UTBK difficulty. Question keys for all 144 additions were checked against independently worked answer grids in tests; this does not replace human content review. Keys/hints/explanations remain in server-only modules and are withheld from active assessments. See content-bank.md for contribution rules.

## Package-based tryout beta

The handoff Flow 04 / CA-04 describes Tryout Home → Section / Package → Detail → Access Check → Timed Test → Results. The previous Tryout view contained only a diagnostic placeholder; it now has a public PK/PM/PU catalog and separate diagnostic entry. Three free beta packages use fixed assignments to question IDs/version 1 with stable revision slugs. Count, order, and server deadline are package-controlled. The browser cannot select a different set or grant access. New package revisions must receive a new slug; published question versions must not be edited in place. Attempt snapshots preserve all historical content and grading even if catalog entries are changed later.

For this small beta, the existing `topic` attempt column stores the package revision slug when kind is `tryout`; question snapshots continue to carry academic subtopics for grading and mastery. `202610060002_tryout_packages.sql` adds that attempt kind without rewriting old sessions and replaces the start RPC with a database-owned 30-minute deadline. Both adapters resume by owner/kind/package revision. Tryouts have no hints/live feedback/retries within the test, contribute mastery at .35, and count as a learning day upon completion. Result tabs separate score, subtopic analysis, and solutions. Package history is filtered from the latest 30 completed learning sessions, not a lifetime first/best summary.

These are **free, noncompetitive seed packages**, not published commercial assessments. They intentionally share the teaching bank and do not claim protected exposure, calibrated UTBK scores, or real rankings. Dedicated protected question assignments, editorial publication lifecycle, lifetime first/best summaries, competitive first-attempt ranking, paid/Pro entitlements, bundles, and verified payment fulfillment remain deferred. No paid access or payment success is simulated in the UI. The current seed taxonomy does not represent full official UTBK sections.

### Twenty-question revision

Per the user’s requested UTBK format, the current catalog uses package revision 2: 20 fixed questions / 20 minutes for each PK/PM/PU package. Version-one assignments and metadata are retained for historical results; the server rejects new starts of retired revisions. Migration `202610060003_tryout_20_questions.sql` gives new revision-two attempts a database-owned 1,200,000 ms deadline without updating any existing row. Active older attempts resume through their saved ID with their original 15 questions / 30-minute deadline. The local adapter derives package duration from revision metadata. The learning diagnostic remains the handoff’s separate 15-question / 30-minute initial profile.

### Second package

The catalog now offers Package 01 and Package 02 for each section. Package 02 is a new version-one resource (`pk-02-v1`, `pm-02-v1`, `pu-02-v1`), each with 20 fixed questions / 20 minutes. Its assignments use different question IDs and stems from the current same-section Package 01. Some questions use alternate parameters within the existing problem families; these remain shared-bank free beta content, not a claim of new topic coverage. Legacy 15-question metadata is created only for Package 01, never for the new version-one packages. Migration `202610060004_tryout_package_02.sql` explicitly includes Package 02 in the 20-minute deadline group, so question-version suffixes do not determine timing. Package 01 assignments, active deadlines, and historical results remain intact.
