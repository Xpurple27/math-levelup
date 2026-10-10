import ExcelJS from "exceljs";
import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import {
  parseWorkbook,
  importHeaders,
  inspectWorkbook,
} from "../../src/features/content/excel";
import { extractDocxText, parseDocx } from "../../src/features/content/docx";
import type { Catalog } from "../../src/features/content/model";
const c: Catalog = {
  exams: [{ id: "x", code: "SNBT", name: "Exam", status: "ACTIVE" }],
  sections: [
    { id: "s", code: "PM", name: "Section", exam_id: "x", status: "ACTIVE" },
  ],
  domains: [{ id: "d", code: "ALG", name: "Domain", status: "ACTIVE" }],
  topics: [
    { id: "t", code: "LIN", name: "Topic", domain_id: "d", status: "ACTIVE" },
  ],
  subtopics: [
    { id: "st", code: "EQ", name: "Subtopic", topic_id: "t", status: "ACTIVE" },
  ],
  published_count: 0,
};
const row = {
  code: "TEST-IMPORT",
  exam: "SNBT",
  section: "PM",
  domain: "ALG",
  topic: "LIN",
  subtopic: "EQ",
  difficulty: "BASIC",
  stem: "TEST_ONLY $x+1=3$",
  option_a: "1",
  option_b: "2",
  option_c: "3",
  option_d: "4",
  answer: "B",
  understanding: "Understand",
  concept: "Concept",
  first_step: "Step",
  solution: "Solution",
  final_answer: "2",
  source_type: "ORIGINAL",
  source_title: "Test only",
};
async function file(rows: Record<string, unknown>[]) {
  const w = new ExcelJS.Workbook(),
    s = w.addWorksheet("Questions");
  s.addRow(importHeaders);
  for (const r of rows) s.addRow(importHeaders.map((k) => r[k] ?? ""));
  return new Uint8Array(await w.xlsx.writeBuffer());
}

function storedZip(name: string, text: string) {
  const filename = Buffer.from(name);
  const data = Buffer.from(text);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0, 6);
  local.writeUInt16LE(0, 8);
  local.writeUInt32LE(0, 14);
  local.writeUInt32LE(data.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(filename.length, 26);
  const localEntry = Buffer.concat([local, filename, data]);

  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0, 8);
  central.writeUInt16LE(0, 10);
  central.writeUInt32LE(0, 16);
  central.writeUInt32LE(data.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(filename.length, 28);
  central.writeUInt32LE(0, 42);
  const centralEntry = Buffer.concat([central, filename]);

  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(1, 8);
  end.writeUInt16LE(1, 10);
  end.writeUInt32LE(centralEntry.length, 12);
  end.writeUInt32LE(localEntry.length, 16);
  return new Uint8Array(Buffer.concat([localEntry, centralEntry, end]));
}

function docx(lines: string[]) {
  const xml = `<?xml version="1.0"?><w:document xmlns:w="urn:test"><w:body>${lines
    .map((line) => `<w:p><w:r><w:t>${line.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</w:t></w:r></w:p>`)
    .join("")}</w:body></w:document>`;
  return storedZip("word/document.xml", xml);
}

describe("bounded Excel import", () => {
  it("downloads a real template whose examples never become drafts", async () => {
    const p = await parseWorkbook(
      readFileSync("public/templates/levelup-question-import.xlsx"),
      c,
      [],
    );
    expect(p.summary.valid).toBe(0);
    expect(p.summary.skipped).toBe(1);
    expect(p.rows[0].parsed).toBeNull();
  });
  it("parses classification, markdown, one answer and required explanations", async () => {
    const p = await parseWorkbook(await file([row]), c, []);
    expect(p.summary.valid).toBe(1);
    expect(
      p.rows[0].parsed?.options
        .filter((o) => o.is_correct)
        .map((o) => o.option_key),
    ).toEqual(["B"]);
    expect(p.rows[0].parsed?.stem_md).toContain("$x+1=3$");
  });
  it("blocks unknown taxonomy, invalid keys, duplicate codes and missing explanations", async () => {
    const p = await parseWorkbook(
      await file([
        row,
        { ...row, answer: "A,B", solution: "", domain: "UNKNOWN" },
      ]),
      c,
      [],
    );
    expect(p.summary.invalid).toBe(2);
    expect(p.summary.duplicate_codes).toEqual(["TEST-IMPORT"]);
    expect(p.rows[1].error_message).toMatch(/taxonomy/i);
    expect(p.rows[1].error_message).toMatch(/answer/i);
    expect(p.rows[1].error_message).toMatch(/solution/i);
    expect(
      (await parseWorkbook(await file([row]), c, ["TEST-IMPORT"])).summary
        .invalid,
    ).toBe(1);
  });
  it("rejects formula cells, oversized files and non-workbooks", async () => {
    const p = await parseWorkbook(
      await file([{ ...row, stem: { formula: "1+1", result: 2 } }]),
      c,
      [],
    );
    expect(p.rows[0].status).toBe("INVALID");
    expect(p.rows[0].error_message).toMatch(/Formula/);
    expect(() => inspectWorkbook(new Uint8Array(2 * 1024 * 1024 + 1))).toThrow(
      "2 MB",
    );
    expect(() => inspectWorkbook(new Uint8Array([1, 2, 3]))).toThrow(
      "tidak valid",
    );
  });
});

describe("bounded DOCX ingestion", () => {
  const defaults = { section_id: "s", subtopic_id: "st", difficulty: "HARD", source_title: "paket-pm.docx" };

  it("extracts Word paragraphs and turns a numbered question into a draft", async () => {
    const bytes = docx([
      "1. Jika x + 2 = 5, nilai x adalah...",
      "A. 1",
      "B. 2",
      "C. 3",
      "D. 4",
      "E. 5",
      "Kunci: C",
      "Pembahasan: Kurangi kedua ruas dengan 2 sehingga x = 3.",
      "Cara Cepat: Pindahkan 2 ke ruas kanan.",
    ]);
    expect(extractDocxText(bytes)).toContain("Kunci: C");
    const preview = await parseDocx(bytes, c, defaults);
    expect(preview.summary.valid).toBe(1);
    expect(preview.summary.source_format).toBe("DOCX");
    expect(preview.summary.warnings).toBeGreaterThan(0);
    expect(preview.rows[0].parsed?.difficulty).toBe("HARD");
    expect(preview.rows[0].parsed?.options.find((o) => o.is_correct)?.option_key).toBe("C");
    expect(preview.rows[0].parsed?.explanation.solution_md).toContain("x = 3");
    expect(preview.rows[0].raw.warnings).toMatch(/dilengkapi/i);
  });

  it("rejects a structurally ambiguous Word question without an answer key", async () => {
    const preview = await parseDocx(docx([
      "1. Pilih hasil yang benar.",
      "A. 1",
      "B. 2",
      "C. 3",
      "D. 4",
    ]), c, defaults);
    expect(preview.summary.invalid).toBe(1);
    expect(preview.rows[0].error_message).toMatch(/kunci/i);
  });
});
