# VECTRA student pilot protocol

Status: **ready-to-run protocol; no pilot participants or outcomes are claimed here.**

Target: 10–20 students preparing for UTBK.

## Purpose

Validate whether one VECTRA learning loop can be completed and understood:

`Diagnostic → Learning Profile → Next Direction → Learn → Practice → Assessment → Progress`

The pilot is for product usability and flow validation. It is not a controlled study of learning effectiveness and must not be described as proving score improvement.

## Minimum data policy

Collect only what is required for product validation:

- anonymous pilot ID, for example `P01`–`P20`;
- device category: phone / tablet / laptop;
- timestamps or durations for the milestones below;
- completion/failure state;
- short issue notes and feedback.

Do not copy email addresses, passwords, names, school IDs, phone numbers, access tokens, cookies, screenshots containing credentials, or sensitive personal data into the pilot report.

Keep demo/test accounts separate from real student accounts.

## Participant instruction

1. Open the VECTRA production URL supplied by the facilitator.
2. Create an account or sign in.
3. Start VECTRA Diagnostic.
4. Complete the diagnostic without external help.
5. Read the Learning Profile and Next Direction.
6. Open the recommended lesson and read it through the final lesson step.
7. Continue to the recommended Practice set and complete it.
8. Open Assessment and complete the assigned Mini Tryout or reassessment scope.
9. Open Progress and review the latest evidence.
10. Report any point where wording, navigation, mathematics, layout, loading, or account state is confusing.

If the production backend is unavailable, stop the pilot. Do not switch students to an unrelated database or pretend the production flow was tested.

## Facilitator task scenarios

### Scenario A — account and resume

- Sign in.
- Start an attempt and answer at least three questions.
- Reload the page.
- Confirm answers remain selected.
- If instructed, sign out and sign in again, then confirm the active attempt can be resumed.

### Scenario B — learning direction

- Complete Diagnostic.
- State in your own words what “Mastery”, “Confidence”, and “Next Direction” mean.
- Open the recommended lesson.
- Confirm the lesson matches the recommendation shown previously.

### Scenario C — learn to practice

- Read the recommended lesson.
- Continue to Practice from the end of the lesson.
- Confirm the selected Practice domain is relevant to the learning path.
- Complete the Practice set and open its explanation.

### Scenario D — reassessment and progress

- Complete the assigned assessment.
- Review result and explanation.
- Open Progress.
- Confirm the completed attempt appears in history and can be reopened.

## Metrics

For each pilot ID record:

| Metric | Definition |
| --- | --- |
| Account success | Student reaches authenticated workspace without facilitator workaround |
| Diagnostic completion | Diagnostic is submitted successfully |
| Recommendation open rate | Student opens the recommended published learning path |
| Lesson completion proxy | Student reaches the final lesson step |
| Practice completion | Recommended Practice attempt is submitted |
| Reassessment completion | Assigned assessment is submitted |
| Result reopen success | Student reopens a completed attempt from Progress |
| Critical failure | Flow cannot continue due to auth, storage, missing content, timer, submit or rendering defect |

Recommended summary after the pilot:

- completion count / participants for each milestone;
- median time to first diagnostic completion;
- number of critical failures by category;
- number of students who correctly explain Next Direction;
- top three repeated usability issues;
- device-specific failures.

Do not infer learning gains from these metrics.

## Feedback questions

Ask after the task, not during every screen:

1. Setelah diagnostik, apakah kamu memahami posisi kemampuan yang ditampilkan? Bagian mana yang membingungkan?
2. Apakah “Next Direction” menjelaskan apa yang perlu kamu pelajari berikutnya?
3. Apakah materi yang dibuka terasa sesuai dengan rekomendasi sebelumnya?
4. Apakah soal, opsi, rumus, tabel, dan pembahasan mudah dibaca di perangkatmu?
5. Saat salah, apakah pembahasan membantu memahami alasan dan langkah penyelesaiannya?
6. Apakah kamu tahu apa yang harus dilakukan setelah menyelesaikan materi dan Practice?
7. Apakah timer, penyimpanan jawaban, reload, dan submit terasa dapat dipercaya?
8. Di titik mana kamu paling ragu harus menekan apa?
9. Jika memakai VECTRA lagi, bagian mana yang paling ingin kamu gunakan?
10. Satu perubahan apa yang paling penting sebelum VECTRA diberikan ke lebih banyak siswa?

## Issue log template

| Pilot ID | Device | Step | Severity | What happened | Reproducible? | Screenshot ref | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P01 | phone | Diagnostic submit | critical/high/medium/low | ... | yes/no | anonymized ref only | open/fixed/retest |

Severity:

- **critical** — user cannot continue, data loss, wrong scoring/key exposure, cross-user access;
- **high** — major incorrect content/timer/result or repeated auth/session failure;
- **medium** — confusing flow, layout defect, explanation/rendering problem with workaround;
- **low** — polish/copy issue that does not block the task.

## Exit criteria for initial pilot

Before inviting 10–20 students:

- production Supabase is active;
- account/login smoke test passes;
- at least one recommended learning path and matching Practice are published;
- the assigned assessment is accessible;
- answer keys stay hidden during active attempts;
- resume and result reopening work;
- desktop and mobile critical E2E are green or documented with a non-product infrastructure blocker.

After pilot data exists, create a dated anonymized report. Until then the only valid claim is **“ready for pilot”**, not “validated by students”.
