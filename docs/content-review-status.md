# MT-01 / MT-02 content review status

Checked: 27 October 2026.

This document intentionally separates **last known production facts** from facts that could be re-verified today.

## Current verification state

The correct VECTRA Supabase project (`azrpaihfdtghcbdxkhqh`) is currently `INACTIVE`. Direct database queries fail, so the stabilization pass cannot truthfully enumerate the current question-version status or inspect all question bodies from production.

No content version was approved, published, rejected, deleted, or duplicated by this stabilization pass.

## Last verified package structure

Last database verification available from 18 October 2026 recorded:

| Suite | Section | Questions | Timer |
| --- | --- | ---: | ---: |
| MT-01 | PU | 30 | 30 min |
| MT-01 | PK | 20 | 20 min |
| MT-01 | PM | 20 | 42.5 min |
| MT-02 | PU | 30 | 30 min |
| MT-02 | PK | 20 | 20 min |
| MT-02 | PM | 20 | 42.5 min |

Each suite therefore had 70 questions and a nominal total of 92 minutes 30 seconds with timer authority remaining per section.

Treat this table as **historical until re-query succeeds**.

## Historical review queue

A report dated 18 October 2026 recorded **113 question versions in `IN_REVIEW`**. That count cannot be confirmed while the project is inactive.

When the backend is restored, do not regenerate those revisions blindly. First query their IDs, parent question IDs, statuses and package/lesson references.

Required classification:

| Version ID | Question code | Section | Current status | Reviewer approval | Math/editorial status | Referenced by | Action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| … | … | PK/PM/PU | DRAFT/IN_REVIEW/QA_PASSED/PUBLISHED/etc. | verified/pending | verified/pending/rejected | tryout/practice/lesson/current pointer | publish/revise/reject/wait |

## QA standard to apply after backend restoration

The existing VECTRA PK, PM and PU writer/blueprint standards were reread during this stabilization. Review must check at least:

1. stem/stimulus is unambiguous and contains sufficient information;
2. mathematical/logical solution is independently recomputed;
3. exactly one intended answer exists for single-choice items;
4. no distractor is equivalent to the correct option;
5. option units, forms and precision are consistent;
6. explanation reaches the correct answer and does not silently rely on unstated assumptions;
7. explanation fields are coherent: understanding/known/asked/concept/first step/solution/final answer/shortcut/common mistake/option analysis when applicable;
8. option-letter references remain correct after option reorder;
9. taxonomy matches the actual construct: PK vs PM vs PU Induktif/Deduktif/Kuantitatif;
10. difficulty label is supported by reasoning depth/representation load, not just large arithmetic;
11. LaTeX, tables and any media render correctly on desktop and phone;
12. the item is original and not a reconstruction of official/leaked questions.

### PK-specific

Use the five official broad domains: Bilangan, Aljabar, Geometri dan Pengukuran, Analisis Data, Peluang. Granular subtopics are a VECTRA production taxonomy, not an official weighting claim.

### PM-specific

Check content plus reasoning process (Formulating/Employing/Interpreting-Evaluating) and context. Do not accept a PK computation with decorative story text as PM.

### PU-specific

Keep the construct boundaries explicit:

- Induktif: generalization/evidence/causal reasoning/analogy/pattern/strengthen-weaken;
- Deduktif: implication/quantifier/syllogism/sequencing/grouping/constraints;
- Kuantitatif: elementary quantitative reasoning, not advanced PK or multi-stage PM modeling.

## Publication rules

The stabilization agent must not self-sign human review.

After reviewer approval exists and publication is authorized:

- publish through the repository/application workflow rather than direct ad-hoc row edits;
- maintain `current_version_id` consistency;
- update tryout/practice/lesson references only to intended approved versions;
- do not rewrite snapshots in completed attempts;
- verify the package question count and timer contract after pointer changes;
- rerun render and assessment tests.

## Acceptance evidence required

Stage 2 can be called complete only when a backend-active verification produces:

- current count by question-version status;
- exact list/status of the historical 113 revisions or an explanation of how that historical set changed;
- exact version IDs currently referenced by MT-01/MT-02;
- reviewer/math/editorial decision for every proposed replacement;
- automated structural validation results;
- a reviewed sample of rendered desktop/mobile questions and explanations;
- proof that student packages reference the approved versions.

Until then the accurate status is: **review procedure ready; production content re-verification blocked by inactive backend**.
