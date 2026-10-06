# LevelUP-Math — Repo & Engineering Workflow

## Repo
Target:
`Xpurple27/LevelUP-Math`

Visibility:
Private.

## Do Not
- do not clone whole V2;
- do not start with dozens of migrations;
- do not create many CI jobs immediately;
- do not push every small edit;
- do not build future features early.

## Initial Folder Structure
```text
LevelUP-Math/
├── src/
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── lib/
│   └── types/
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── tests/
├── tests/
│   ├── unit/
│   └── e2e/
├── docs/
│   ├── product/
│   ├── architecture/
│   └── decisions/
├── public/
├── AGENTS.md
├── README.md
└── package.json
```

## Git Strategy
Main:
`main`

Feature branches:
- feat/bootstrap
- feat/auth
- feat/diagnostic
- feat/learning
- feat/practice
- feat/mastery
- feat/progress
- feat/tryout
- feat/commerce

Keep PR small and coherent.

## CI Strategy
Minimal first.

Default PR:
- format check
- lint
- typecheck
- unit test
- build

Only if DB migration changes:
- Supabase local reset
- pgTAP
- DB lint

Only critical exam flows:
- Playwright critical E2E

Use path filters where possible.

## Local-First Rule
Before push:
1. install
2. format
3. lint
4. typecheck
5. unit tests
6. build
7. DB test if schema changed
8. E2E if critical flow changed

Then push once.

## Why
The goal is to avoid GitHub Actions exhaustion caused by repeated small pushes/reruns.

## Commit Style
Examples:
- feat(auth): establish student authentication
- feat(diagnostic): add initial assessment flow
- feat(learning): build subtopic learning module
- feat(practice): add recommended practice sessions
- feat(mastery): implement evidence-based mastery
- fix(exam): preserve autosaved response on retry
- docs(product): lock diagnostic flow

## Definition of Done per PR
Only require relevant gates.
Do not run all expensive gates on every docs/UI-only change.

## Product Guardrail
Before coding any feature:
Ask:
1. Does it improve Tryout, Learn, Practice, or Progress?
2. Is it needed for current vertical slice?
3. Can it be built simpler?
4. Does it create premature complexity?
5. Is there a real user-facing benefit now?

If not, defer.
