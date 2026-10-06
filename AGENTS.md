<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project workflow

Use the existing checkout. Cloud tasks are isolated; do not create Git worktrees unless requested. Read README.md and docs/architecture.md before changing runtime boundaries. Keep answer keys server-only, preserve frozen attempt history, and enforce ownership and scoring on the server. Do not push or deploy unless the user requests it. Run format, lint, typecheck, unit, build, and relevant E2E checks after coherent application changes. Vercel always uses Supabase Auth/Postgres. Local SQLite is allowed only for local development. Read docs/deployment.md before changing deployment configuration. Never expose SUPABASE_SERVICE_ROLE_KEY or allow public reads of frozen snapshots.
