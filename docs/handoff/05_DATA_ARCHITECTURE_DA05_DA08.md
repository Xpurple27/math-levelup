# LevelUP-Math — Data Architecture DA-05 to DA-08

# DA-05 — Progress & Engagement

## Weekly Snapshot
Store:
- mastery_start
- mastery_end
- mastery_delta
- confidence_start
- confidence_end
- questions_solved
- practice_sessions
- tryouts_completed
- modules_completed
- active_days
- domain snapshot
- exam performance snapshot
- snapshot_version

Week:
Monday–Sunday, Asia/Jakarta.

Completed weekly snapshots immutable.

## Streak
Source truth = learning_activity_days.

Active day only if meaningful learning:
- diagnostic
- module
- mini assessment
- tryout
- >=5 practice questions

Login does not count.

## Goals
user_goals:
- exam_score
- math_mastery

Old goals should be superseded rather than silently overwritten.

## Badge
Current badge derived from mastery.
Highest badge history can be stored.

## Achievement
Milestones such as:
- first diagnostic
- first tryout
- 100 questions
- 7-day streak
- first mastered topic
- top 10 tryout
- improvement milestone

## Tryout Leaderboard
Source = valid competitive attempts.
Ranking:
1. score desc
2. unanswered asc
3. time asc

Only first competitive attempt.

## Improvement Leaderboard
Source = weekly progress snapshot.
Eligibility:
- mastery_delta > 0
- >=20 questions
- >=2 active days
- sufficient confidence

## Privacy
leaderboard opt-out.

Suspicious attempts should be invalidated, not deleted.

No mastery decay V1; use review_due instead.

---

# DA-06 — Security & RLS

Security model:
**default deny / least privilege**

Data classes:
- Public Content
- Authenticated User Data
- Protected Content
- Server/Internal

Schemas:
- public = intentional RLS-safe app surfaces
- private = server-only sensitive data

Rules:
- RLS on exposed tables
- grants + RLS both matter
- user-owned rows use auth.uid()
- roles stored in DB, not user_metadata
- answer keys never direct-readable
- raw question bank not freely browsable by students
- scoring server-side
- attempt creation controlled
- submit controlled
- mastery writes server-only
- progress writes server-only
- payment state server-only
- entitlement mutation server-only
- payment events private
- service key never browser
- admin browser uses normal auth + authorization
- critical operations require audit
- security negative tests mandatory

Staff roles:
- STUDENT
- CONTENT_AUTHOR / EDITOR
- REVIEWER
- ADMIN
- SYSTEM trusted operations

---

# DA-07 — Performance & Query Architecture

Principle:
**query-driven indexing, not index-everything**

Hot paths:
- dashboard
- learn
- practice
- assessment
- submit
- result
- progress
- leaderboard
- access resolver
- transactions

Important indexes:
- questions(subtopic_id, difficulty) where published
- learning_modules(subtopic_id, sort_order) where published
- assessment_attempts(user_id, started_at desc)
- competitive leaderboard partial index
- practice_sessions(user_id, started_at desc)
- question_exposures(user_id, question_id)
- mastery_evidence(user_id, subtopic_id, created_at desc)
- recommendations active partial index
- weekly snapshots week+delta
- transactions user+date
- transaction provider reference
- pending expiry partial index
- entitlement access indexes

Views candidates:
- academic taxonomy
- user subtopic progress
- user topic mastery
- user domain mastery
- current math mastery
- tryout leaderboard
- improvement leaderboard

Rules:
- avoid N+1
- avoid select *
- no ORDER BY random() on large banks
- select candidate pool server-side then sample
- do not send broad candidate pool to browser
- save attempt answers incrementally
- submit finalizes, not uploads all answers
- snapshots for result/weekly history
- use EXPLAIN ANALYZE before guessing optimizations
- no premature materialized views

---

# DA-08 — Migration & Implementation

For repo baru LevelUP-Math, this becomes **reference import strategy**, not direct migration-first requirement.

Principles:
- V1/V2 are references, not architecture authority.
- Do not copy entire V2.
- Reuse only proven concepts/components selectively.
- Preserve any imported historical data through explicit migration if chosen.
- No big-bang copy.

If historical data is later imported:
- preserve IDs where valid
- use mapping tables if semantics differ
- never turn XP into mastery
- legacy evidence can contribute at lower confidence
- preserve purchased access rights
- historical attempts stay immutable
- imported entitlements tagged `source_type = migration`

Engineering rollout:
- bootstrap
- taxonomy
- question bank
- assessment
- learning
- practice
- mastery
- progress
- engagement
- commerce
- hardening

Testing:
- unit
- DB/pgTAP
- RLS negative tests
- E2E critical flows
- migration replay for any persistent DB changes
