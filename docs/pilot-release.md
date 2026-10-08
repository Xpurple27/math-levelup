# LevelUP Math — Pilot Release Candidate

Status: **candidate, not a completed hosted release**. Scope is confidence migration readiness, hosted verification, contextual reports, and 20 pilot questions. No payments, ranking, recovery, adaptive learning, or other features were added.

## Pilot content boundary

Use [pilot-content.md](pilot-content.md) and `content/pilot-manifest.json` for the exact 63-ID union: diagnostic 15; three learning modules with fixed guided/mini and five-item Practice; Package 01 Pilot RC in PK/PM/PU (20 each). Enable `NEXT_PUBLIC_LEVELUP_PILOT_MODE=1` before the Vercel build. The three new stable slugs are `pk-pilot-v1`, `pm-pilot-v1`, `pu-pilot-v1`, all using question revision 2. Previous Package 01/02 versions, the original bank and saved history remain unchanged. Package 02 is outside this pilot.

Run `npm run pilot:qa` for distributions, families and pending ambiguity flags. Use `content/question-qa.json` records keyed `question_id@2` to review exact pilot revisions. All remain NEEDS_REVIEW pending named human checks, date and hash confirmation. Do not auto-approve. A candidate label and balanced key positions are not human approval or calibrated UTBK content.

## Deployment checklist (operator)

- [ ] Record the Git commit being deployed, target Vercel URL, Supabase project, operator and date. Set `NEXT_PUBLIC_LEVELUP_PILOT_MODE=1` before building. Use fresh, dedicated pilot/test accounts so no older active random-bank session is resumed; never record passwords, server keys or cookies in this checklist.
- [ ] Vercel uses Node 24 and `LEVELUP_BACKEND=supabase`. Set `NEXT_PUBLIC_SUPABASE_URL`, the supported public key variable from [deployment.md](deployment.md), and private `SUPABASE_SERVICE_ROLE_KEY`. Never prefix the server key with `NEXT_PUBLIC_`.
- [ ] Supabase Auth Site URL and allowed `/auth/callback` redirect URLs match the intended production/preview origin. Confirm email confirmation behavior and use a confirmed test account for the automated smoke.
- [ ] Use a quiet testing window. Pause student use and stop old deployment writers. Deploy this revision, wait for older requests to drain, then run any missing SQL migrations in filename order. Legacy users may temporarily see a storage-upgrade notice before confidence backfill completes. Keep older previews from writing afterward.
- [ ] Apply prior `202610060001`–`202610060004` migrations if missing. Apply [confidence migration](../supabase/migrations/202610070001_unique_mastery_evidence.sql), then [pilot/report migration](../supabase/migrations/202610070002_pilot_reports.sql) in Supabase SQL Editor. This is the operator's SQL step; no hosted SQL was executed by Codex.
- [ ] Confidence backfill rebuilds only legacy evidence/count/advanced/confidence from answered completed snapshots. It preserves mastery value, snapshots, results and activities. It is transactional and replayable, with a 5-second lock wait limit and 120-second statement limit. If timeout occurs, roll back the editor transaction if needed, clear old writers and rerun in a quieter window; for a large history review the execution time before intentionally increasing limits.
- [ ] Run [read-only SQL verifier](../supabase/verify-pilot.sql). Every row must return `passed = true`: private RLS tables, no browser table/RPC access, service-role access, pilot deadline support and upgraded confidence metadata/count. This checks configuration, not live authentication or actual browser persistence.
- [ ] Verify the Vercel deployment contains the selected Git commit; checks against a previous deployment do not qualify this RC.

## Hosted verifier

Read-only public HTTP checks (no account creation, no learning writes):

```sh
LEVELUP_HOSTED_URL=https://math-levelup.vercel.app npm run verify:hosted
```

Checks page response, online backend selection, anonymous write rejection and cross-origin rejection. Missing/failed checks exit nonzero. Public checks alone cannot validate Postgres storage or email callback.

For the authenticated smoke, bind `LEVELUP_PILOT_EMAIL` and `LEVELUP_PILOT_PASSWORD` securely in the execution environment to a **dedicated confirmed test account**, then run:

```sh
LEVELUP_HOSTED_URL=https://math-levelup.vercel.app npm run verify:hosted -- --learning-smoke
```

This deliberately writes a pilot attempt, 20 answers (option A), one test report and a completed result/mastery/activity for that account. It may resume that account's active pilot attempt, so never use a student account. It checks private payloads, the 20-minute deadline, autosave, reload, report acknowledgement, finalization, duplicate submission, progress and logout. No password, cookie, personal account data or response body is logged. The script does not modify Supabase settings or execute migrations.

- [ ] All automated hosted checks pass against the selected deployment.
- [ ] Manually register a separate test account, follow confirmation email, log in, reload and reopen the browser. Confirm the session and saved learning survive; check mobile layout too.
- [ ] Manually confirm two users cannot open/report each other's attempts (404), an anonymous report returns 401, and assessment payloads do not contain keys/hints/solutions before completion.
- [ ] In SQL Editor, inspect only the dedicated account's `levelup_reports` row to confirm its attempt/question/category/view/context/version. Also check `levelup_page_reports` for general feedback: page/topic and an owned attempt context for result-page reports. Report acknowledgement is not a review resolution workflow. Reports are private; no browser list/export or admin CMS exists.
- [ ] Test feedback from an active question and a completed solution, plus failure/retry behavior. A report must not change answers, mastery, result or deadline; reporting does not pause the timer.
- [ ] Finish human QA for the 63 exact pilot revisions before inviting students into this subset. Feedback is plain text, at most 1,000 characters; do not enter secrets or personal information. Duplicate reports for the same owner/attempt/question/category/view (or page/category/topic for general feedback) acknowledge the first stored report without overwriting it.

## Release decision

Local checks establish a reviewable RC, not a deployed pilot. Approve a limited pilot only after the above hosted and human-QA checks. Record PASS/FAIL/NOT RUN separately with commit and date. If confidence migration or report storage fails, keep the pilot closed and fix the corresponding SQL/configuration before retrying. Do not revert to an older writer after upgrading confidence metadata.
