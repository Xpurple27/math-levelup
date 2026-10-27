# VECTRA Math — portfolio case study

Status: implementation-backed case study. Claims of real student adoption or learning improvement must be added only after real pilot data exists.

## Problem

UTBK preparation often gives students a score or a bank of questions without clearly connecting the result to the next learning action. VECTRA Math is designed around a smaller question:

> After measuring a student, what should the product help them do next?

The product principle is:

`Position → Direction → Progress`

## Product flow

The target learning loop is:

`Diagnostic → Learning Profile → Recommended Learning → Learn → Practice → Assessment → Progress`

The milestone deliberately focuses on PK, PM and PU before expanding into unrelated product areas.

## Product contribution

The project owner combines mathematics teaching/content expertise with product implementation. The system includes:

- UTBK taxonomy and content workflows;
- versioned question content and publication workflow;
- diagnostic, practice and assessment experiences;
- structured explanations;
- mastery/confidence evidence model;
- learning modules and lesson content;
- recommendation direction;
- attempt persistence, timer and result history;
- responsive student/admin/reviewer surfaces.

Do not describe every repository capability as production-validated. See `vectra-execution-status.md` for current evidence.

## Architecture summary

### Student runtime

- Next.js App Router application.
- Vercel deployment.
- Supabase Auth for hosted identity.
- Supabase/Postgres for hosted attempts, mastery, question/content data and learning data.
- Correct answers and scoring remain server-side during active assessments.

### Content architecture

Questions have stable identity and versioned content. Published content is not edited in place; revision creates a new version. Attempt snapshots preserve the question representation used when the attempt was created so completed history is not silently changed by later content edits.

### Assessment contract

- user ownership is checked server-side;
- active attempt keys/explanations are not exposed to the student client;
- server sets timer deadlines;
- saved answers can be resumed;
- finalization is designed to be idempotent;
- completed attempts are reopenable from Progress.

## Scoring and recommendation

### Session score

A session score is the percentage of correct answers in that session. It is not an official UTBK score prediction.

### Mastery

Question evidence receives internal difficulty weights:

- Basic: 1
- Medium: 1.5
- Hard: 2

An evidence score is capped by the most advanced difficulty represented. Mastery is updated as a weighted blend of previous mastery and new session evidence. Session-type weights currently include diagnostic, guided, practice and tryout evidence.

### Confidence

Confidence is not a statistical probability. It measures the amount and diversity of unique question evidence accumulated for a topic. Repeating the same question ID does not create unlimited new confidence.

### Direction

A recommendation should not point into an empty module. The pilot-readiness stabilization filters recommended topics against published learning modules that also have published lessons, then carries that direction into Learn and the nearest matching Practice domain.

## Content QA

PK, PM and PU use separate production standards and blueprints. Content QA checks include:

- exact answer correctness;
- no equivalent distractor or multiple correct choices;
- sufficient assumptions/data;
- taxonomy alignment;
- difficulty rationale;
- structured explanation quality;
- mathematical/LaTeX rendering;
- mobile readability;
- option-letter references after option reorder;
- independent review before publication.

The stabilization task does not self-approve reviewer gates. Current production content status must be re-queried after the Supabase project is active.

## Verification evidence

As of 27 October 2026:

- the production Vercel deployment for the current main commit is READY;
- the expected VECTRA Supabase project is INACTIVE, preventing production database acceptance tests;
- historical PR #16 E2E proved several important server contracts (ownership, expiry/idempotent finalization, pending signup behavior and admin QA workflow) while revealing stale UI locators;
- the pilot-readiness branch adds Next.js 16 session refresh and removes recommendation dead-ends.

See `vectra-execution-status.md` for exact status and blockers.

## Limitations

- mastery/confidence are rules-based internal indicators, not calibrated psychometrics;
- production backend inactivity currently blocks a full production acceptance run;
- content approval requires human reviewer workflow where configured;
- no claim of real student outcome improvement is made before pilot data exists;
- the current scope covers PK, PM and PU, not the entire UTBK-SNBT test battery.

## 60–90 second demo scenario

Use a clearly labeled demo/test account. Do not present demo data as a real student record.

**0–10s — Position**

Open VECTRA. Show `Know Your Direction` and start Diagnostic. Voiceover: “VECTRA starts by measuring evidence, not by throwing students into a random question bank.”

**10–25s — Learning Profile**

Show a completed diagnostic result and Progress/learning profile. Point to mastery, confidence/evidence count and a weak area. State that these are internal evidence indicators, not official UTBK predictions.

**25–40s — Direction**

Show Next Direction and open the recommended published lesson. Highlight concept, guided example/common mistake, and checkpoint content.

**40–55s — Practice**

Continue from the final lesson to the related Practice domain. Answer one sample item and briefly show structured explanation after the allowed point in the flow.

**55–72s — Measure again**

Open Assessment/Mini Tryout and show the package-level entry, section timer concept, and result view with analysis/pembahasan.

**72–90s — Progress**

Return to Progress and reopen the completed attempt from history. End with: `Position → Direction → Progress ↗`.

## CV-safe claim template

Use claims tied to implementation, for example:

> Built VECTRA Math, a Next.js + Supabase learning and assessment platform for UTBK preparation with versioned question content, server-side assessment controls, mastery/evidence tracking, guided learning, practice and timed assessment flows.

After a real pilot, append only measured, anonymized metrics that can be traced to a dated pilot report.
