# Supabase + Vercel deployment

Vercel always selects Supabase Auth/Postgres. Do not deploy SQLite/PGlite runtime data. The operator applies SQL and configures environment values; local tests do not prove hosted setup is complete.

## SQL

For a new database, execute all files under `supabase/migrations` in filename order. For a project already on the previous pilot baseline, apply these **three new migrations in order**:

1. `202610090001_content_v2.sql`
2. `202610090002_content_operations.sql`
3. `202610090003_reset_generated_content.sql`

The third migration intentionally removes only obsolete generated-content attempts and dependent mastery/report/activity data as specified in [content reset](content-reset.md). Inspect it and take a project backup before execution. Auth users/profiles and unrelated histories are retained. Do not remove/rewrite historical migration files; they remain needed for replay/upgrades.

Run `supabase/verify-content-v2.sql`. Expect no missing tables/browser grants, RLS true, both browser RPC permission flags false, invalid_published zero and initial production_published zero. This verifier is read-only and prints no answer content. Check applied migrations in Supabase's migration history if using its CLI.

## Roles

Create/confirm two separate accounts with Supabase Auth through the app. In the Supabase SQL Editor, assign roles to the intended existing accounts (replace these placeholders with your own emails):

```sql
INSERT INTO public.levelup_roles(user_id,role)
SELECT id,'ADMIN' FROM auth.users WHERE email='YOUR_ADMIN_EMAIL'
ON CONFLICT(user_id) DO UPDATE SET role=excluded.role;
INSERT INTO public.levelup_roles(user_id,role)
SELECT id,'REVIEWER' FROM auth.users WHERE email='YOUR_REVIEWER_EMAIL'
ON CONFLICT(user_id) DO UPDATE SET role=excluded.role;
```

Verify each statement matches one account. Accounts with no row are STUDENT. Do not grant through signup metadata or browser SQL. A reviewer must differ from question creator/last editor. The service key is required for server operations; never paste it into chat, source, frontend variables or test artifacts.

## Vercel environment

Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or the application's supported anon-key fallback) and server-only `SUPABASE_SERVICE_ROLE_KEY`. Use your project's values in Vercel settings. The service key must never have a NEXT_PUBLIC prefix. Redeploy after environment changes. Do not set local test flags as deployment configuration.

Supabase Auth Site URL should be the production Vercel URL. Configure `/auth/callback` redirect allowlist for the production URL and any deliberate preview/local environments. If email confirmation is enabled, the student confirms email then logs in; unconfirmed signup does not grant a session. Existing local accounts do not automatically migrate into Supabase.

## Hosted acceptance checklist

1. Run the migration verifier and inspect expected results.
2. Confirm an ordinary student account persists across reload/login and cannot access `/admin` or authoring APIs.
3. Confirm ADMIN opens the Question Bank and saves a draft; its options/explanation render Markdown/KaTeX in preview.
4. Send to QA. Confirm self-review fails, the separate REVIEWER approves, and approval alone does not make content available to students.
5. ADMIN publishes explicitly. Confirm a new revision leaves the prior published version available and cannot change existing frozen attempts.
6. Upload the downloadable Excel template: the example must be skipped. Upload real curated rows, inspect preview/errors, confirm DRAFT only and complete independent QA before publication.
7. With enough published questions, verify diagnostic start, answer autosave, reload/resume, expiry/finalization, results/progress and contextual feedback.
8. Confirm learning/tryout display their intentional empty state and no obsolete packages appear.
9. If linking media, upload existing objects to a dedicated public content bucket and register `bucket/path`; verify display and alt text. Keep answer-bearing/private objects out of active question media.

Human mathematical/editorial approval, sufficient published coverage, hosted SQL/role/environment setup and the live checklist remain prerequisites for student release. C1–C4 is an authoring foundation, not a full content library or Learning/Tryout Builder.
