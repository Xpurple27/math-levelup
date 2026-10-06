# Prompt untuk ChatGPT Work / Codex

You are taking over the LevelUP-Math project.

## Product Context
LevelUP-Math is a math-focused tryout + learning platform.

Primary product:
TRYOUT

Supporting engines:
- Learn
- Practice
- Progress

Core loop:
Diagnostic/Tryout → Score → Weakness → Learn → Guided Practice → Mini Assessment → Practice → Progress → Tryout Again.

Initial target:
UTBK/SNBT students, especially PK, PM, PU.

## Important Product Rule
Do not overengineer.

Use:
**V1-speed + V2-safety**

Take simplicity inspiration from LevelUP Academy V1.
Take only proven engineering ideas from LevelUP Academy V2.

Do NOT copy V2 wholesale.

## Repository
Target new private repository:
`Xpurple27/LevelUP-Math`

If repo does not exist, stop and ask user to create it.
If it exists, work inside it.

## Development Workflow
- Work local-first.
- Do not push every small change.
- Batch coherent changes.
- Run relevant tests locally before push.
- Keep GitHub Actions usage low.
- Do not create expensive CI jobs unless needed.
- Use path-aware CI where possible.
- Avoid feature creep.
- Do not implement future architecture just because it exists in docs.

## Source of Truth
Read all markdown handoff files before implementation.

Priority:
1. Product Vision
2. User Flows
3. Content Architecture
4. Data Architecture
5. System Architecture
6. Repo Workflow

## First Milestone
Build this vertical slice first:

Login/Register  
→ Onboarding minimal  
→ Diagnostic 15 questions / 30 min  
→ Result with weakness/strength  
→ Recommended Learn module  
→ Learn one subtopic  
→ Guided Practice  
→ Mini Assessment  
→ Update Mastery  
→ Show Progress

Do NOT start with:
- payment
- leaderboard
- AI
- games
- advanced analytics
- IRT
- complicated adaptive engine

## Phase 0 — Bootstrap
1. Initialize Next.js App Router + TypeScript + Tailwind.
2. Add Supabase SSR/auth baseline.
3. Add Vitest.
4. Add Playwright.
5. Add minimal docs.
6. Add minimal CI.
7. Create modular folders only as needed.

## Phase 1 — Taxonomy + Question Foundation
Implement minimal:
- Exam
- Section
- Domain
- Topic
- Subtopic
- Skills optional if needed immediately
- Question + immutable version
- Single choice
- private answer authority
- explanation

Seed UTBK PK/PM/PU and initial math taxonomy.

## Phase 2 — Diagnostic Vertical Slice
Implement:
- onboarding
- diagnostic assessment
- frozen attempt
- server timer
- autosave
- submit
- result
- initial mastery evidence
- weakness display

## Phase 3 — Learn
Implement one complete subtopic path:
- concept
- how to recognize
- first step
- worked example
- 6 guided questions
- mini assessment 5 questions

## Phase 4 — Practice + Progress
Implement:
- recommended practice
- custom practice minimal
- mastery update
- confidence
- progress page

## Architecture Rules
Browser must not decide:
- correctness
- score
- mastery
- deadline
- payment
- entitlement

Answer keys must never be exposed during active assessment.

Published question versions must be immutable.

Historical attempts/results must remain reproducible.

## Scope Control
If a requirement is not needed for current milestone:
defer it and document it.

## GitHub Usage Rule
Before push:
- format
- lint
- typecheck
- unit
- build
- DB tests if applicable
- E2E only when critical

Prefer one stable push over many corrective pushes.

## Final Goal of Initial Build
A real student should be able to:
1. register;
2. take diagnostic;
3. see weakness;
4. learn a recommended subtopic;
5. practice;
6. see mastery/progress change.

If this works reliably, only then move to broader Tryout/commercial features.
