import ExcelJS from "exceljs";
import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import {
  parseWorkbook,
  importHeaders,
  inspectWorkbook,
} from "../../src/features/content/excel";
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
