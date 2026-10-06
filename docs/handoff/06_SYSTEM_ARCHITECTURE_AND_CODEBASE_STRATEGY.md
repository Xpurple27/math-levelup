# LevelUP-Math — System Architecture & Codebase Strategy

## Final Repository Decision
Create a NEW repository:

`Xpurple27/LevelUP-Math`

Private.

Do not use LevelUP-Academy-V2 as implementation base.

## Why New Repo
Goal sekarang:
- product research yang bersih;
- simplicity seperti V1;
- strong core seperti V2;
- menghindari technical baggage;
- menghindari rasa “V2 ditambah fitur”;
- membangun vertical slice yang usable lebih cepat.

## Reference Repositories
### V1
Use as reference for:
- simplicity
- product speed
- UX directness
- practical implementation

### V2
Use selectively for:
- Supabase SSR Auth
- role model
- private answer authority
- question versioning
- assessment revision pinning
- frozen attempts
- DB-authoritative timer
- autosave
- trusted submission
- trusted scoring
- immutable result snapshot
- entitlement abstraction
- important pgTAP/security tests

Do NOT copy the entire repo wholesale.

## Target Technical Style
**Simple Modular Monolith**

Stack:
- Next.js App Router
- TypeScript
- Tailwind
- Supabase Auth + Postgres + Storage
- Vitest
- Playwright
- Vercel

## Target Feature Modules
src/features/
- auth
- identity
- taxonomy
- questions
- assessments
- exam
- results
- learning
- practice
- mastery
- recommendations
- progress
- leaderboard
- goals
- achievements
- entitlements
- commerce
- notifications
- admin-audit

Do not create all modules day one.
Create when needed.

## Route Target
Public:
- /
- /tryout
- /tryout/[slug]
- /pricing
- /leaderboard
- /help

Auth:
- /login
- /register
- /forgot-password
- /reset-password

Student:
- /dashboard
- /diagnostic
- /learn
- /practice
- /tryout
- /exam/[attemptId]
- /results/[attemptId]
- /progress
- /profile
- /account

Admin:
- /admin
- /admin/taxonomy
- /admin/questions
- /admin/learning
- /admin/assessments
- /admin/products
- /admin/transactions
- /admin/audit

## Student Bottom Nav
Maximum five:
- Home
- Learn
- Practice
- Tryout
- Progress

## Trusted Operations
Sensitive actions must not be generic browser writes:
- start assessment
- save assessment response
- submit assessment
- start practice
- submit practice answer
- complete practice
- recalculate mastery
- generate recommendation
- create checkout
- process webhook
- fulfill transaction
- grant/revoke entitlement
- publish question
- publish assessment
- invalidate attempt

## Engineering Principle
**V1-speed + V2-safety**

Implement:
- simple UI/flows;
- strong authority at critical boundaries only.

Critical boundaries:
- auth
- answer key
- timer
- attempt state
- scoring
- historical result
- payment
- entitlement

Everything else should remain simple until scale/data proves need.
