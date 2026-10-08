# Excel import

Download `/templates/levelup-question-import.xlsx` from `/admin/imports`. Regenerate with `npm run content:template`. The workbook includes a `Questions` sheet and instructions. Its example row has `example=TRUE`: it is always skipped and never becomes production content. Replace it with human-curated content and set FALSE/remove the marker. Template content is an example, not an approved question bank.

The template columns are: example, code, exam, section, domain, topic, subtopic, difficulty, instruction, stimulus, stem, option_a–option_e, answer, understanding, known, asked, concept, first_step, solution, final_answer, shortcut, common_mistake, option_analysis, source_type, source_title, source_page. Preserve headers; optional cells may be blank. Code is optional (generated when blank); otherwise uppercase letters/digits/hyphens, up to 80 characters. Answer is one letter A–E. Difficulty is BASIC/MEDIUM/HARD. Markdown and inline/display LaTeX are preserved.

## Classification and validation

Use existing active taxonomy **codes**, not invented labels/UUIDs. Initial labels: SNBT; sections PK/PM/PU; ARI→NUM→RATIO or PERCENT; ALG→LIN→EQ. Sections belong to exams; knowledge taxonomy is independent of sections. Select the correct classification for human-curated questions. Import never creates unknown taxonomy.

Rows require a stem, four or five distinct nonempty options, a valid answer pointing to an option, and Understanding/Concept/First Step/Solution/Final Answer. Source type is ORIGINAL/PAST_EXAM/ADAPTED/PDF/EXCEL/AI_ASSISTED/OTHER. Duplicate codes already present or repeated within the workbook fail validation. Missing required explanation, invalid difficulty/key, unknown taxonomy or inconsistent hierarchy produces a row error.

Only `.xlsx` is supported. Maximum compressed file 2 MB, expanded ZIP total 32 MB, individual entry 8 MB, 512 archive entries, 200 data rows and 40 columns. Formula/shared-formula cells are rejected; use literal text/value. ZIP64/encrypted archives are rejected. No formulas, macros or HTML are executed.

## Lifecycle

`UPLOADED → PARSING → READY_FOR_REVIEW` or `VALIDATION_FAILED`/`FAILED`. Parsing persists raw and parsed rows, VALID/INVALID/SKIPPED states, row numbers, errors and counts. The UI shows total/valid/invalid/skipped, row previews and errors before confirmation.

**Any invalid row blocks the whole job.** Fix the workbook and upload again. An example-only/blank workbook cannot be confirmed. Confirm Import as DRAFT creates all valid rows in one database transaction, records question IDs and changes job/rows to IMPORTED. Duplicate conflicts during confirmation roll back the entire transaction. Retrying a completed confirmation is idempotent.

Confirmation never approves or publishes. Open each imported draft, review its classification/content/provenance, Send to QA, obtain independent QA approval and explicitly Publish. REVIEWER and STUDENT cannot import.

## Common errors

- Header missing/duplicate: start from the downloaded template.
- Unknown taxonomy/mismatch: use codes displayed in the bank/editor; verify exam→section and domain→topic→subtopic.
- Malformed answer: use a single existing option letter, not option text or A,B.
- Duplicate code: assign a new code; import does not overwrite existing questions.
- Missing explanation: complete required sections; a bare answer or one-line generated solution is not publication approval.
- VALIDATION_FAILED: inspect every invalid row; confirmation remains disabled.
- FAILED: inspect the saved job error, file type/size and formula cells, then re-upload.

Imports do not read PDF or connect Google Drive, and do not produce tryout packages or learning modules.
