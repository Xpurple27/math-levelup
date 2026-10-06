import { describe, it, expect } from "vitest";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { bank, selectQuestions } from "../../src/lib/content";
import { tryoutQuestions } from "../../src/lib/tryout-content";
import { topics } from "../../src/lib/topics";
import {
  contentQAReport,
  questionReviews,
  isQuestionAllowed,
  effectiveQAStatus,
  qaChecks,
  questionContentHash,
  questionFamily,
  structuralIssues,
  type QARecord,
} from "../../src/lib/content-qa";
const qaPath = "content/question-qa.json";
if (process.env.LEVELUP_QA_INITIALIZE === "1") {
  if (Object.keys(JSON.parse(readFileSync(qaPath, "utf8"))).length)
    throw new Error("Refusing to overwrite existing QA reviews.");
  writeFileSync(
    qaPath,
    JSON.stringify(
      Object.fromEntries(
        bank.map((q) => [
          q.id,
          {
            status: "NEEDS_REVIEW",
            contentHash: questionContentHash(q),
            ...questionFamily(q),
            notes: "Generated seed; independent human review pending.",
          },
        ]),
      ),
      null,
      2,
    ) + "\n",
  );
}
const records = JSON.parse(readFileSync(qaPath, "utf8")) as Record<
  string,
  QARecord
>;
describe("source-based content QA", () => {
  it("tracks all 252 questions without auto-approving generated content", () => {
    expect(bank).toHaveLength(252);
    expect(Object.keys(records).sort()).toEqual(bank.map((q) => q.id).sort());
    for (const q of bank) {
      const review = records[q.id];
      expect(["VALID", "NEEDS_REVIEW", "REJECTED"]).toContain(review.status);
      expect(review.family).toBeTruthy();
      expect(review.variant).toBeTruthy();
      expect(review.contentHash).toMatch(/^[a-f0-9]{64}$/);
      expect(structuralIssues(q)).toEqual([]);
      expect(topics.find((t) => t.id === q.topic)?.section).toBe(q.section);
      if (review.status === "VALID")
        expect(effectiveQAStatus(q, review)).toBe("VALID");
    }
  });
  it("requires named human checks and ties approval to exact content", () => {
    const q = bank[0];
    const reviewed: QARecord = {
      status: "VALID",
      contentHash: questionContentHash(q),
      ...questionFamily(q),
      reviewer: "Fixture reviewer",
      reviewedAt: "2026-10-07",
      checks: Object.fromEntries(qaChecks.map((k) => [k, true])),
    };
    expect(effectiveQAStatus(q, reviewed)).toBe("VALID");
    expect(
      effectiveQAStatus({ ...q, stem: q.stem + " changed" }, reviewed),
    ).toBe("NEEDS_REVIEW");
    expect(
      effectiveQAStatus(q, {
        ...reviewed,
        checks: { ...reviewed.checks, answerKey: false },
      }),
    ).toBe("NEEDS_REVIEW");
    expect(effectiveQAStatus(q, { ...reviewed, status: "REJECTED" })).toBe(
      "REJECTED",
    );
    expect(effectiveQAStatus(q, undefined)).toBe("NEEDS_REVIEW");
  });

  it("excludes rejected questions from new practice and refuses a fixed package with a rejected item", () => {
    const q = bank.find((q) => q.id === "rasio-1")!,
      previous = questionReviews[q.id];
    try {
      questionReviews[q.id] = { ...previous, status: "REJECTED" };
      expect(isQuestionAllowed(q)).toBe(false);
      expect(
        selectQuestions("practice", "rasio", 10, { difficulty: "Basic" }).some(
          (picked) => picked.id === q.id,
        ),
      ).toBe(false);
      expect(() => tryoutQuestions("pk-01-v2")).toThrow(
        "Versi soal paket tidak tersedia",
      );
    } finally {
      questionReviews[q.id] = previous;
    }
  });
  it("flags the seed distractor pattern for human review without rewriting questions", () => {
    const report = contentQAReport(bank, records);
    expect(report.numericOptionPattern).toMatchObject({
      numericQuestionCount: 252,
      minimumKeyCount: 171,
      maximumKeyCount: 0,
    });
    const generated = bank.filter((q) => q.id.includes("-f"));
    expect(
      contentQAReport(generated, records).numericOptionPattern.minimumKeyCount,
    ).toBe(144);
  });
  it("reports duplication without claiming mathematical or UTBK calibration", () => {
    const q = bank[0];
    const report = contentQAReport([q, { ...q, id: "duplicate-fixture" }], {});
    expect(report.exactDuplicates).toEqual([[q.id, "duplicate-fixture"]]);
    expect(report.byStatus.NEEDS_REVIEW).toBe(2);
    expect(JSON.stringify(report)).not.toContain('"correct"');
    expect(JSON.stringify(report)).not.toContain('"solution"');
  });
});
if (process.env.LEVELUP_QA_REPORT === "1") {
  mkdirSync(".reports", { recursive: true });
  const report = contentQAReport(bank, records);
  writeFileSync(
    ".reports/content-qa.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      ...report.byStatus,
      exactDuplicateGroups: report.exactDuplicates.length,
      nearDuplicateGroups: report.nearDuplicates.length,
      numericOptionPattern: report.numericOptionPattern,
      report: ".reports/content-qa.json",
    }),
  );
}
