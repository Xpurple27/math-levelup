# Pilot content: explicit bounded set

The pilot targets 3–5 students. Its content manifest is [content/pilot-manifest.json](../content/pilot-manifest.json). Enable `NEXT_PUBLIC_LEVELUP_PILOT_MODE=1` in the pilot deployment **before rebuilding**. The server then pins diagnostic/guided/mini/practice sessions to this manifest and the UI limits learning to three modules and tryouts to the three revised Package 01 sets. Package 02 and the original seed bank remain available outside pilot mode and unchanged. Existing active/completed snapshots remain authoritative.

## Counts and selection

| Slice             | Count                                                                    | Section/topic scope                               | Human approval                       |
| ----------------- | ------------------------------------------------------------------------ | ------------------------------------------------- | ------------------------------------ |
| Diagnostic        | 15                                                                       | 5 PK, 5 PM, 5 PU; all seven existing subtopics    | 0 VALID                              |
| Learning          | 18 guided slots + 15 mini slots; 26 distinct IDs including practice pool | Rasio (8), linear equations (10), percentages (8) | 0 VALID                              |
| Tryout            | 60                                                                       | 20 each in PK/PM/PU Package 01 Pilot RC           | 0 VALID                              |
| Whole pilot union | 63 distinct logical IDs at revision 2                                    | 23 PK, 20 PM, 20 PU                               | 0 VALID, 63 NEEDS_REVIEW, 0 REJECTED |

The slices overlap. Counts must not be summed as distinct questions. Diagnostic is a fixed representative selection from the existing Package 01 IDs, not a newly expanded bank. Each learning module includes its existing concepts, recognition, first step and worked example, six guided items (two per difficulty) and five mini items (three Medium, two Hard). Pilot Practice is five Mixed items; larger/custom-level sessions remain outside this pilot boundary.

Rasio tests modeling totals/differences, linear equations tests translating context into an equation, and percentages tests changing calculation bases. These are accessible starting modules with different common mistakes. The diagnostic and three section packages provide breadth without reviewing all 252 seed records. Difficulty labels remain preliminary; several “Hard” generated stems are simple and need a human difficulty decision.

## Mathematical/editorial audit evidence

All 63 revision keys have an independently worked numeric grid in `tests/unit/pilot.test.ts`; the existing expanded-content tests also retain their independent checks. Revisions preserve correct numeric answers and solution calculations, replace options, and retain their logical IDs. `persen-f11-v1` additionally clarifies signed price change (negative means loss) because zero net profit and negative options needed consistent wording. No item was automatically approved or rejected.

The three learning examples were checked: ratios 3:5 with total 40 yields 15; taxi 8,000 + 4,000/km with total 28,000 yields 5 km; successive 20% discount and 10% tax on 100,000 yields 88,000. Concepts and first steps agree with those calculations. Student clarity and instructional usefulness still require human review and observation.

## Distractors and QA registry

Revised options use errors in totals versus differences, percentages and changing bases, area versus perimeter, weighted means, ordered versus unordered counting, and sequence indexing/sums. They are not only a reshuffle of the old positive-offset options. All three tryouts have five keys at each letter and five correct answers at each numeric rank; run `npm run pilot:qa` for exact distributions, minimum/maximum counts, exact/near-family duplicates and pending ambiguity flags. Aggregate balance is not proof that each distractor is plausible.

Use the existing [question QA registry](../content/question-qa.json). Legacy records keep `question_id` keys; pilot revision records use `question_id@2` and exact content hashes. Review status is per exact revision. The registry deliberately contains **no automatic VALID approval**. Rejection blocks new exposure; frozen history is unchanged. A named human reviewer must complete the existing checklist plus distractor plausibility and answer pattern checks, date the review, and confirm the hash before approving the relevant record. Similar-family groups remain intentionally flagged rather than claiming independent psychometric evidence.

## Every pilot question ID

The table below is the exact pilot union. Each listed revision currently awaits a human reviewer.

| question_id       | Revision | Section | Subtopic   | Difficulty | Used in                                                           | QA           |
| ----------------- | -------- | ------- | ---------- | ---------- | ----------------------------------------------------------------- | ------------ |
| `rasio-1`         | 2        | PK      | rasio      | Basic      | Diagnostic, PK 01, rasio/guided, rasio/practice                   | NEEDS_REVIEW |
| `rasio-2`         | 2        | PK      | rasio      | Basic      | PK 01, rasio/guided, rasio/practice                               | NEEDS_REVIEW |
| `rasio-13`        | 2        | PK      | rasio      | Medium     | Diagnostic, PK 01, rasio/guided, rasio/mini, rasio/practice       | NEEDS_REVIEW |
| `rasio-14`        | 2        | PK      | rasio      | Medium     | PK 01, rasio/guided, rasio/mini, rasio/practice                   | NEEDS_REVIEW |
| `rasio-25`        | 2        | PK      | rasio      | Hard       | PK 01, rasio/guided, rasio/mini, rasio/practice                   | NEEDS_REVIEW |
| `persen-f1-v1`    | 2        | PK      | persen     | Basic      | PK 01, persen/guided, persen/practice                             | NEEDS_REVIEW |
| `persen-f2-v1`    | 2        | PK      | persen     | Basic      | PK 01, persen/guided, persen/practice                             | NEEDS_REVIEW |
| `persen-f5-v1`    | 2        | PK      | persen     | Medium     | Diagnostic, PK 01, persen/guided, persen/mini, persen/practice    | NEEDS_REVIEW |
| `persen-f6-v1`    | 2        | PK      | persen     | Medium     | PK 01, persen/guided, persen/mini, persen/practice                | NEEDS_REVIEW |
| `persen-f9-v1`    | 2        | PK      | persen     | Hard       | PK 01, persen/guided, persen/mini, persen/practice                | NEEDS_REVIEW |
| `geometri-f1-v1`  | 2        | PK      | geometri   | Basic      | Diagnostic, PK 01                                                 | NEEDS_REVIEW |
| `geometri-f2-v1`  | 2        | PK      | geometri   | Basic      | PK 01                                                             | NEEDS_REVIEW |
| `geometri-f5-v1`  | 2        | PK      | geometri   | Medium     | PK 01                                                             | NEEDS_REVIEW |
| `geometri-f6-v1`  | 2        | PK      | geometri   | Medium     | PK 01                                                             | NEEDS_REVIEW |
| `geometri-f9-v1`  | 2        | PK      | geometri   | Hard       | Diagnostic, PK 01                                                 | NEEDS_REVIEW |
| `rasio-26`        | 2        | PK      | rasio      | Hard       | PK 01, rasio/guided, rasio/mini, rasio/practice                   | NEEDS_REVIEW |
| `persen-f7-v1`    | 2        | PK      | persen     | Medium     | PK 01, persen/mini, persen/practice                               | NEEDS_REVIEW |
| `persen-f10-v1`   | 2        | PK      | persen     | Hard       | PK 01, persen/guided, persen/mini, persen/practice                | NEEDS_REVIEW |
| `geometri-f7-v1`  | 2        | PK      | geometri   | Medium     | PK 01                                                             | NEEDS_REVIEW |
| `geometri-f10-v1` | 2        | PK      | geometri   | Hard       | PK 01                                                             | NEEDS_REVIEW |
| `aljabar-1`       | 2        | PM      | aljabar    | Basic      | Diagnostic, PM 01, aljabar/guided, aljabar/practice               | NEEDS_REVIEW |
| `aljabar-2`       | 2        | PM      | aljabar    | Basic      | PM 01, aljabar/guided, aljabar/practice                           | NEEDS_REVIEW |
| `aljabar-3`       | 2        | PM      | aljabar    | Basic      | PM 01, aljabar/practice                                           | NEEDS_REVIEW |
| `aljabar-13`      | 2        | PM      | aljabar    | Medium     | Diagnostic, PM 01, aljabar/guided, aljabar/mini, aljabar/practice | NEEDS_REVIEW |
| `aljabar-14`      | 2        | PM      | aljabar    | Medium     | PM 01, aljabar/guided, aljabar/mini, aljabar/practice             | NEEDS_REVIEW |
| `aljabar-15`      | 2        | PM      | aljabar    | Medium     | PM 01, aljabar/mini, aljabar/practice                             | NEEDS_REVIEW |
| `aljabar-25`      | 2        | PM      | aljabar    | Hard       | Diagnostic, PM 01, aljabar/guided, aljabar/mini, aljabar/practice | NEEDS_REVIEW |
| `aljabar-26`      | 2        | PM      | aljabar    | Hard       | PM 01, aljabar/guided, aljabar/mini, aljabar/practice             | NEEDS_REVIEW |
| `peluang-f1-v1`   | 2        | PM      | peluang    | Basic      | Diagnostic, PM 01                                                 | NEEDS_REVIEW |
| `peluang-f2-v1`   | 2        | PM      | peluang    | Basic      | PM 01                                                             | NEEDS_REVIEW |
| `peluang-f5-v1`   | 2        | PM      | peluang    | Medium     | Diagnostic, PM 01                                                 | NEEDS_REVIEW |
| `peluang-f6-v1`   | 2        | PM      | peluang    | Medium     | PM 01                                                             | NEEDS_REVIEW |
| `peluang-f7-v1`   | 2        | PM      | peluang    | Medium     | PM 01                                                             | NEEDS_REVIEW |
| `peluang-f9-v1`   | 2        | PM      | peluang    | Hard       | PM 01                                                             | NEEDS_REVIEW |
| `peluang-f10-v1`  | 2        | PM      | peluang    | Hard       | PM 01                                                             | NEEDS_REVIEW |
| `aljabar-16`      | 2        | PM      | aljabar    | Medium     | PM 01, aljabar/practice                                           | NEEDS_REVIEW |
| `aljabar-27`      | 2        | PM      | aljabar    | Hard       | PM 01, aljabar/practice                                           | NEEDS_REVIEW |
| `peluang-f3-v1`   | 2        | PM      | peluang    | Basic      | PM 01                                                             | NEEDS_REVIEW |
| `peluang-f8-v1`   | 2        | PM      | peluang    | Medium     | PM 01                                                             | NEEDS_REVIEW |
| `peluang-f11-v1`  | 2        | PM      | peluang    | Hard       | PM 01                                                             | NEEDS_REVIEW |
| `statistika-1`    | 2        | PU      | statistika | Basic      | Diagnostic, PU 01                                                 | NEEDS_REVIEW |
| `statistika-2`    | 2        | PU      | statistika | Basic      | PU 01                                                             | NEEDS_REVIEW |
| `statistika-3`    | 2        | PU      | statistika | Basic      | PU 01                                                             | NEEDS_REVIEW |
| `statistika-13`   | 2        | PU      | statistika | Medium     | Diagnostic, PU 01                                                 | NEEDS_REVIEW |
| `statistika-14`   | 2        | PU      | statistika | Medium     | PU 01                                                             | NEEDS_REVIEW |
| `statistika-15`   | 2        | PU      | statistika | Medium     | PU 01                                                             | NEEDS_REVIEW |
| `statistika-25`   | 2        | PU      | statistika | Hard       | Diagnostic, PU 01                                                 | NEEDS_REVIEW |
| `statistika-26`   | 2        | PU      | statistika | Hard       | PU 01                                                             | NEEDS_REVIEW |
| `pola-f1-v1`      | 2        | PU      | pola       | Basic      | PU 01                                                             | NEEDS_REVIEW |
| `pola-f2-v1`      | 2        | PU      | pola       | Basic      | PU 01                                                             | NEEDS_REVIEW |
| `pola-f5-v1`      | 2        | PU      | pola       | Medium     | Diagnostic, PU 01                                                 | NEEDS_REVIEW |
| `pola-f6-v1`      | 2        | PU      | pola       | Medium     | PU 01                                                             | NEEDS_REVIEW |
| `pola-f7-v1`      | 2        | PU      | pola       | Medium     | PU 01                                                             | NEEDS_REVIEW |
| `pola-f9-v1`      | 2        | PU      | pola       | Hard       | Diagnostic, PU 01                                                 | NEEDS_REVIEW |
| `pola-f10-v1`     | 2        | PU      | pola       | Hard       | PU 01                                                             | NEEDS_REVIEW |
| `statistika-16`   | 2        | PU      | statistika | Medium     | PU 01                                                             | NEEDS_REVIEW |
| `statistika-27`   | 2        | PU      | statistika | Hard       | PU 01                                                             | NEEDS_REVIEW |
| `pola-f3-v1`      | 2        | PU      | pola       | Basic      | PU 01                                                             | NEEDS_REVIEW |
| `pola-f8-v1`      | 2        | PU      | pola       | Medium     | PU 01                                                             | NEEDS_REVIEW |
| `pola-f11-v1`     | 2        | PU      | pola       | Hard       | PU 01                                                             | NEEDS_REVIEW |
| `rasio-15`        | 2        | PK      | rasio      | Medium     | rasio/mini, rasio/practice                                        | NEEDS_REVIEW |
| `rasio-27`        | 2        | PK      | rasio      | Hard       | rasio/practice                                                    | NEEDS_REVIEW |
| `persen-f11-v1`   | 2        | PK      | persen     | Hard       | persen/practice                                                   | NEEDS_REVIEW |
