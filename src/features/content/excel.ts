import { inflateRawSync } from "node:zlib";
import ExcelJS from "exceljs";
import {
  blankDraft,
  explanationFields,
  sourceTypes,
  type Catalog,
  type Draft,
} from "./model";
export const importHeaders = [
  "example",
  "code",
  "exam",
  "section",
  "domain",
  "topic",
  "subtopic",
  "difficulty",
  "instruction",
  "stimulus",
  "stem",
  "option_a",
  "option_b",
  "option_c",
  "option_d",
  "option_e",
  "answer",
  "understanding",
  "known",
  "asked",
  "concept",
  "first_step",
  "solution",
  "final_answer",
  "shortcut",
  "common_mistake",
  "option_analysis",
  "source_type",
  "source_title",
  "source_page",
];
export type ImportRow = {
  row_number: number;
  raw: Record<string, string>;
  parsed: Draft | null;
  status: "VALID" | "INVALID" | "SKIPPED";
  error_message: string | null;
};
export type ImportPreview = {
  rows: ImportRow[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    skipped: number;
    duplicate_codes: string[];
  };
};
// Bound expanded ZIP sizes before handing the workbook to ExcelJS; ZIP64/encrypted inputs are rejected.
export function inspectWorkbook(bytes: Uint8Array) {
  if (bytes.length > 2 * 1024 * 1024) throw new Error("XLSX maksimal 2 MB.");
  const b = Buffer.from(bytes);
  let end = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 65558); i--)
    if (b.readUInt32LE(i) === 0x06054b50) {
      end = i;
      break;
    }
  if (end < 0) throw new Error("File XLSX/ZIP tidak valid.");
  const count = b.readUInt16LE(end + 10),
    offset = b.readUInt32LE(end + 16);
  if (count > 512 || offset === 0xffffffff)
    throw new Error("Workbook terlalu besar/ZIP64 tidak didukung.");
  let pos = offset,
    total = 0;
  for (let i = 0; i < count; i++) {
    if (pos + 46 > b.length || b.readUInt32LE(pos) !== 0x02014b50)
      throw new Error("Arsip XLSX rusak.");
    const size = b.readUInt32LE(pos + 24);
    total += size;
    if (
      size > 8 * 1024 * 1024 ||
      total > 32 * 1024 * 1024 ||
      b.readUInt16LE(pos + 8) & 1
    )
      throw new Error("Workbook expanded size terlalu besar atau terenkripsi.");
    const method = b.readUInt16LE(pos + 10),
      compressed = b.readUInt32LE(pos + 20),
      local = b.readUInt32LE(pos + 42);
    if (
      local + 30 > b.length ||
      b.readUInt32LE(local) !== 0x04034b50 ||
      ![0, 8].includes(method)
    )
      throw new Error("Arsip XLSX rusak/metode tidak didukung.");
    const start =
      local + 30 + b.readUInt16LE(local + 26) + b.readUInt16LE(local + 28);
    if (start + compressed > offset) throw new Error("Arsip XLSX rusak.");
    const encoded = b.subarray(start, start + compressed),
      decoded =
        method === 0
          ? encoded
          : inflateRawSync(encoded, { maxOutputLength: 8 * 1024 * 1024 });
    if (decoded.length !== size)
      throw new Error("Ukuran expanded XLSX tidak sesuai.");
    pos +=
      46 +
      b.readUInt16LE(pos + 28) +
      b.readUInt16LE(pos + 30) +
      b.readUInt16LE(pos + 32);
  }
}
function cellText(v: ExcelJS.CellValue): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean")
    return String(v).trim();
  if (v instanceof Date) return v.toISOString();
  if ("formula" in v || "sharedFormula" in v)
    throw new Error("Formula Excel tidak diizinkan; gunakan teks/value.");
  if ("richText" in v)
    return v.richText
      .map((x) => x.text)
      .join("")
      .trim();
  if ("text" in v) return String(v.text).trim();
  throw new Error("Tipe cell tidak didukung.");
}
export async function parseWorkbook(
  bytes: Uint8Array,
  c: Catalog,
  codes: string[],
): Promise<ImportPreview> {
  inspectWorkbook(bytes);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(
    Buffer.from(bytes) as unknown as Parameters<typeof workbook.xlsx.load>[0],
  );
  const sheet = workbook.getWorksheet("Questions");
  if (!sheet) throw new Error("Sheet Questions wajib ada.");
  if (sheet.rowCount > 201 || sheet.columnCount > 40)
    throw new Error("Maksimal 200 baris dan 40 kolom.");
  const header: string[] = [];
  sheet.getRow(1).eachCell({ includeEmpty: true }, (cell, index) => {
    header[index - 1] = cellText(cell.value).toLowerCase();
  });
  const required = importHeaders.filter(
    (k) =>
      ![
        "example",
        "code",
        "option_e",
        "known",
        "asked",
        "shortcut",
        "common_mistake",
        "option_analysis",
        "source_page",
      ].includes(k),
  );
  if (
    required.some((k) => !header.includes(k)) ||
    new Set(header).size !== header.length
  )
    throw new Error("Header kurang atau duplikat. Gunakan template resmi.");
  const rows: ImportRow[] = [],
    counts = new Map<string, number>();
  for (let n = 2; n <= sheet.rowCount; n++) {
    const raw: Record<string, string> = {},
      errors: string[] = [];
    header.forEach((key, i) => {
      try {
        raw[key] = cellText(sheet.getRow(n).getCell(i + 1).value);
      } catch (e) {
        errors.push(e instanceof Error ? e.message : "Invalid cell");
        raw[key] = "";
      }
    });
    if (Object.values(raw).every((v) => !v)) continue;
    if (/^(true|yes|1|example)$/i.test(raw.example || "")) {
      rows.push({
        row_number: n,
        raw,
        parsed: null,
        status: "SKIPPED",
        error_message: "Example row: tidak diimport.",
      });
      continue;
    }
    const d = blankDraft();
    d.code = (raw.code || "").toUpperCase();
    if (d.code) {
      counts.set(d.code, (counts.get(d.code) || 0) + 1);
      if (!/^[A-Z0-9][A-Z0-9-]{0,79}$/.test(d.code))
        errors.push("Malformed code");
      if (codes.includes(d.code)) errors.push("Duplicate code already exists");
    }
    const find = (items: Catalog["exams"], key: string) =>
      items.find(
        (t) => t.code.toUpperCase() === (raw[key] || "").toUpperCase(),
      );
    const exam = find(c.exams, "exam"),
      section = c.sections.find(
        (s) =>
          s.exam_id === exam?.id &&
          s.code.toUpperCase() === (raw.section || " ").trim().toUpperCase(),
      ),
      domain = find(c.domains, "domain"),
      topic = find(c.topics, "topic"),
      subtopic = find(c.subtopics, "subtopic");
    if (!exam || !section || !domain || !topic || !subtopic)
      errors.push("Missing/unknown taxonomy");
    else if (
      section.exam_id !== exam.id ||
      topic.domain_id !== domain.id ||
      subtopic.topic_id !== topic.id
    )
      errors.push("Taxonomy relationship mismatch");
    d.section_id = section?.id || "";
    d.subtopic_id = subtopic?.id || "";
    d.difficulty = (raw.difficulty || "").toUpperCase();
    if (!["BASIC", "MEDIUM", "HARD"].includes(d.difficulty))
      errors.push("Invalid difficulty");
    d.instruction_md = raw.instruction || "";
    d.stimulus_md = raw.stimulus || "";
    d.stem_md = raw.stem || "";
    if (!d.stem_md) errors.push("Missing stem");
    const answer = (raw.answer || "").toUpperCase();
    d.options = ["A", "B", "C", "D", "E"]
      .map((option_key) => ({
        option_key,
        content_md: raw[`option_${option_key.toLowerCase()}`] || "",
        is_correct: answer === option_key,
      }))
      .filter((o) => o.content_md);
    if (
      d.options.length < 4 ||
      new Set(d.options.map((o) => o.content_md.toLowerCase())).size !==
        d.options.length
    )
      errors.push("Requires 4–5 unique options");
    if (
      !["A", "B", "C", "D", "E"].includes(answer) ||
      d.options.filter((o) => o.is_correct).length !== 1
    )
      errors.push("Malformed answer");
    for (const [key, , needed] of explanationFields) {
      const column = key.slice(0, -3);
      d.explanation[key] = raw[column] || "";
      if (needed && !d.explanation[key])
        errors.push("Missing explanation: " + column);
    }
    d.source_type = (raw.source_type || "EXCEL").toUpperCase();
    if (!sourceTypes.includes(d.source_type as (typeof sourceTypes)[number]))
      errors.push("Invalid source type");
    d.source_title = raw.source_title || "";
    d.source_page = raw.source_page || "";
    if (Object.values(raw).some((v) => v.length > 50000))
      errors.push("Cell too long");
    rows.push({
      row_number: n,
      raw,
      parsed: errors.length ? null : d,
      status: errors.length ? "INVALID" : "VALID",
      error_message: errors.length ? [...new Set(errors)].join("; ") : null,
    });
  }
  const duplicates = [...counts].filter(([, n]) => n > 1).map(([code]) => code);
  for (const row of rows)
    if (
      row.status !== "SKIPPED" &&
      duplicates.includes(row.raw.code?.toUpperCase())
    ) {
      row.status = "INVALID";
      row.parsed = null;
      row.error_message = [row.error_message, "Duplicate code in workbook"]
        .filter(Boolean)
        .join("; ");
    }
  if (!rows.length) throw new Error("Workbook tidak memiliki baris data.");
  return {
    rows,
    summary: {
      total: rows.length,
      valid: rows.filter((r) => r.status === "VALID").length,
      invalid: rows.filter((r) => r.status === "INVALID").length,
      skipped: rows.filter((r) => r.status === "SKIPPED").length,
      duplicate_codes: duplicates,
    },
  };
}
