# C4.6 — Content Operations V2

## Goal

Turn existing LevelUP source files into reviewable content drafts without bypassing human QA.

## Supported now

### XLSX

Use the official LevelUP import template. XLSX remains the most deterministic bulk format.

Flow:
`XLSX → parse → validate → preview → confirm → DRAFT → QA → publish`

### DOCX (beta)

DOCX is intended for existing authored question packages. The parser reads WordprocessingML directly without introducing a new runtime dependency.

Recommended structure:

```text
1. Teks pertanyaan...
A. Opsi A
B. Opsi B
C. Opsi C
D. Opsi D
E. Opsi E
Kunci: C
Pembahasan: langkah penyelesaian...
Cara Cepat: ...
Kesalahan Umum: ...
```

Supported explanation markers:

- Understanding / Pemahaman / Apa yang ditanyakan
- Diketahui
- Ditanyakan
- Konsep
- Langkah Pertama
- Pembahasan / Penyelesaian / Solution
- Jawaban Akhir
- Shortcut / Cara Cepat / Trik Cepat
- Kesalahan Umum
- Analisis Opsi

DOCX classification is supplied once before upload (section, subtopic, difficulty) and can be corrected per-question after import.

A DOCX question may enter as DRAFT when its answer/options are structurally valid even if the richer LevelUP explanation is incomplete. Missing required explanation sections are surfaced as warnings and must be completed before QA/publish.

The parser currently expects selectable Word text. Image-only/scanned DOCX is not supported.

## PDF

PDF ingestion is the next format. Text PDFs and scanned PDFs have different extraction requirements, so PDF is deliberately not routed through the DOCX parser. Future flow:

`PDF → text/image detection → extraction/OCR when needed → parse → DRAFT → human review`

No PDF or AI-assisted parser may publish automatically.

## Media upload

Admin Media now supports direct upload to Supabase Storage.

Default bucket: `levelup-content` (private)

Allowed media:

- PNG
- JPEG
- WebP
- AVIF
- SVG
- PDF

Maximum upload size: 5 MB.

The server uploads with the Supabase service role and registers metadata through the existing admin content RPC. Browser/student clients never receive storage write credentials.

Advanced manual registration remains available for objects already present in storage.

## Provenance

Question source types now include `DOCX`. Import jobs infer source format from file extension. Imported content remains a draft and preserves its source filename/title for later audit.

## Explanation standard

LevelUP questions are not considered publish-ready with answer key alone. Required structured explanation fields remain:

- Understanding
- Concept
- First step
- Solution
- Final answer

Recommended enrichment:

- Known
- Asked
- Shortcut / cara cepat
- Common mistake
- Option analysis

## Safety boundaries

- No auto-publish from XLSX/DOCX/PDF.
- Answer keys remain server-only in assessment runtime.
- Published versions stay immutable.
- File expansion is bounded to reduce ZIP bomb risk.
- Invalid options/keys block import.
- Missing rich explanation in DOCX is warning-at-import, but publish guards still require required explanation fields.

## Next increments

1. Validate DOCX parser against real user-owned Word packages.
2. Extract/associate embedded DOCX images.
3. Add PDF text ingestion.
4. Add OCR only for scanned PDF inputs.
5. Add normalized-stem duplicate detection across the existing Question Bank.
6. Add media image normalization only after diagram fidelity tests.
