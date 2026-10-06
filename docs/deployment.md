# Deploy to Vercel with Supabase

This revision supports online Supabase Auth and Postgres persistence. Existing SQLite accounts/history remain untouched and are not automatically migrated; online users register through Supabase.

## 1. Apply the database migration

Open your Supabase project's **SQL Editor**. Review and run the complete file:

`supabase/migrations/202610060001_online_learning.sql`

It adds only `levelup_*` tables/functions/indexes. It preserves existing Auth users and unrelated tables. It is replayable. Do not paste server credentials into SQL. Public/anonymous/authenticated roles cannot read the tables or execute trusted scoring/storage functions. The Next.js server uses the server key and scopes every query to the verified user ID.

The migration was tested in local PostgreSQL via PGlite, including denied browser access, frozen attempts, deadline enforcement, concurrent updates, atomic finalization, and duplicate submission. This is not evidence that the hosted migration has already been applied.

## 2. Import GitHub repository into Vercel

Import `Xpurple27/math-levelup`, choose **Next.js**, root directory `.`, and use **Node.js 24.x**. Keep the normal install/build commands (`npm ci`, `npm run build`).

In **Project Settings → Environment Variables**, set the following for Preview and Production before deploying:

| Name                                   | Value                                                                      |
| -------------------------------------- | -------------------------------------------------------------------------- |
| `LEVELUP_BACKEND`                      | `supabase`                                                                 |
| `NEXT_PUBLIC_SUPABASE_URL`             | `https://azrpaihfdtghcbdxkhqh.supabase.co`                                 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Your `sb_publishable_...` public key                                       |
| `SUPABASE_SERVICE_ROLE_KEY`            | The project server-only legacy `service_role` key or modern secret API key |

The legacy anon JWT can be supplied as `NEXT_PUBLIC_SUPABASE_ANON_KEY` instead of the publishable key; only one public key is necessary. The server key must belong to the same project. Enter its value securely in Vercel; never place it in Git, client code, a `NEXT_PUBLIC_` variable, screenshots, or chat. Do not reuse the public anon/publishable key as the server key.

Vercel always selects Supabase, even if `LEVELUP_BACKEND` is accidentally `local`. Missing setup produces a controlled unavailable response; it never stores student data on Vercel's ephemeral filesystem. Setting the four variables does not apply the SQL migration.

## 3. Configure Supabase Auth redirects

After Vercel provides the deployment hostname:

- Supabase **Authentication → URL Configuration → Site URL**: your stable application origin, e.g. `https://your-project.vercel.app`.
- **Redirect URLs**: add `https://your-project.vercel.app/auth/callback` and `http://localhost:3000/auth/callback` for local online development.
- Add the exact callback for a Preview deployment if testing that hostname. Avoid broad wildcards for unrelated preview domains.
- Keep email confirmation enabled if you want verified email ownership. The signup UI asks the student to confirm and then sign in. Opening a confirmation link in the same browser supports the PKCE callback.

Email confirmation is not password recovery. Reset-password UX and persistent auth throttling remain future work. Set up production SMTP and check Supabase email limits before inviting students.

## 4. Verify the deployed flow

Register with an email you control, confirm it, log in, complete diagnostic, read results, learn, practice, and check progress. Log out and back in to verify persistence. Try another account and ensure the first student's history is inaccessible. Inspect Vercel function logs for configuration failures without logging credentials.

Key release limits: the seed content needs editorial/mathematical QA; mastery confidence still counts repeated questions; this initial release is a beta, not a calibrated UTBK predictor. Published-content/admin workflows and durable rate limiting are not implemented.

## Cloud development setup

Use the same four environment names in cloud environment settings. The project hostname must be allowed for outbound HTTPS. The onboarding draft declares these requirements but does not apply the hosted database migration, provide a secret value, or create a Vercel deployment.

For local SQLite development, omit `VERCEL`, use `LEVELUP_BACKEND=local`, and keep the existing `.data` directory. For online local development set `LEVELUP_BACKEND=supabase`; never silently fall back if it fails.
