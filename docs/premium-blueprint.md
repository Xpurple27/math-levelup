# VECTRA premium package blueprint

Status: planning only. This document does not change pricing, access entitlements, payment behavior, or production package status.

Premium work starts only after the free foundation and one complete learning loop are verified.

## Product principle

Premium should sell **better direction and deeper evidence**, not merely “more questions”. The free experience must already demonstrate the core loop; premium extends depth, coverage and repeated measurement.

## Package 1 — Coverage Builder

Purpose: broaden evidence across PK, PM and PU after the free diagnostic/mini tryout.

Candidate content:

- additional curated Practice sets across published taxonomy domains;
- explanation quality equal to or better than the free sets;
- domain-level strength/gap summary;
- recommended reinforcement path after completion;
- saved attempt history during the access period.

Value statement: **Build enough evidence to see which domains are consistently strong or weak.**

## Package 2 — Targeted Reinforcement

Purpose: turn identified learning gaps into an explicit learn → practice → checkpoint cycle.

Candidate content:

- reinforcement sets mapped to published learning paths;
- equivalent-but-different reassessment items where available;
- common-mistake and distractor analysis surfaced after submission;
- comparison between pre-reinforcement and post-reinforcement evidence without claiming psychometric gain.

Value statement: **Practice the gap, not the entire syllabus again.**

## Package 3 — Assessment Series

Purpose: repeated timed measurement after sufficient Practice inventory exists.

Candidate content:

- three premium Mini/UTBK-scope assessment packages built from reviewed exclusive versions;
- fixed package snapshots and section timers;
- result breakdown and structured explanations;
- best-attempt/history view derived from persisted attempts;
- next-direction recommendation linked back to available learning/practice.

Value statement: **Measure whether the direction is producing stronger evidence under time pressure.**

## Gating criteria before implementation

Do not create or market these packages until:

1. Supabase production is active and account/attempt acceptance tests pass.
2. MT-01 and MT-02 version state is re-verified.
3. At least one free Diagnostic → Learn → Practice → Assessment → Progress loop passes desktop and mobile tests.
4. Human review requirements for new/revised question versions are satisfied.
5. The free pilot identifies no critical auth/storage/scoring/content issues.
6. Current pricing and entitlement decisions are re-confirmed before any checkout/payment change.

## Content separation

Premium assessment items should preferably use question versions not already exposed repeatedly in free Practice. Reusing the exact same item can inflate familiarity and weakens reassessment value. If an item must be reused, label the limitation in internal QA and do not interpret improvement as independent evidence.

## Out of scope for this blueprint

- changing the existing Rp30.000 idea or any other price;
- payment-provider implementation;
- subscription architecture;
- IRT/calibrated score claims;
- teacher dashboards;
- AI tutor or unrelated product expansion.
