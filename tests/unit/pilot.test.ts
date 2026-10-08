import { mkdirSync, writeFileSync } from "node:fs";
import { describe, it, expect, vi } from "vitest";
import { bank, publicQuestion } from "../../src/lib/content";
import { tryoutQuestions } from "../../src/lib/tryout-content";
import {
  pilotQuestions,
  pilotManifest,
  pilotSet,
  selectPilot,
  pilotMode,
} from "../../src/lib/pilot";
import {
  effectiveQAStatus,
  questionContentHash,
  questionReviews,
  contentQAReport,
} from "../../src/lib/content-qa";
// Independently worked numeric keys for the three packages and three learning additions.
const keys = [
  20, 12, 20, 12, 50, 50, 20, 99000, 100000, 8, 32, 20, 5, 44, 36, 36, 150, 40,
  4, 4, 4, 5, 6, 4, 5, 6, 4, 5, 20, 2, 4, 12, 2, 4, 10, 7, 6, 6, 6, 5, 62, 63,
  64, 64, 65, 66, 72, 73, 14, 32, 21, 32, 3, 110, 62, 67, 74, 14, 23, 80, 21,
  56, 0,
];
const records = Object.fromEntries(
  pilotQuestions.map((q) => [q.id, questionReviews[`${q.id}@2`]]),
);
function distribution(ids: string[]) {
  const qs = pilotSet(ids);
  return {
    count: qs.length,
    positions: [0, 1, 2, 3].map(
      (i) => qs.filter((q) => q.correct === i).length,
    ),
    numericRanks: [0, 1, 2, 3].map(
      (i) =>
        qs.filter(
          (q) =>
            q.options
              .map(Number)
              .sort((a, b) => a - b)
              .indexOf(Number(q.options[q.correct])) === i,
        ).length,
    ),
  };
}
describe("pilot subset", () => {
  it("pins exactly 63 revisions with independently checked keys and preserves the old bank", () => {
    expect(pilotQuestions).toHaveLength(63);
    expect(new Set(pilotQuestions.map((q) => q.id)).size).toBe(63);
    pilotQuestions.forEach((q, i) => {
      expect(q.version).toBe(2);
      expect(Number(q.options[q.correct])).toBe(keys[i]);
      expect(new Set(q.options).size).toBe(4);
      expect(q.explanation.solution).toBe(
        bank.find((b) => b.id === q.id)!.explanation.solution,
      );
      expect(q.options).not.toEqual(bank.find((b) => b.id === q.id)!.options);
      expect(publicQuestion(q)).not.toHaveProperty("correct");
      expect(questionContentHash(q)).toBe(records[q.id].contentHash);
      expect(effectiveQAStatus(q)).toBe("NEEDS_REVIEW");
    });
    expect(bank).toHaveLength(252);
    for (const q of bank) {
      expect(q.version).toBe(1);
      expect(questionContentHash(q)).toBe(questionReviews[q.id].contentHash);
    }
  });
  it.each(["pk", "pm", "pu"])(
    "keeps %s Package 01 stable and balances revised key positions",
    (section) => {
      const old = tryoutQuestions(`${section}-01-v2`),
        revised = tryoutQuestions(`${section}-pilot-v1`);
      expect(revised.map((q) => q.id)).toEqual(old.map((q) => q.id));
      expect(distribution(revised.map((q) => q.id)).positions).toEqual([
        5, 5, 5, 5,
      ]);
      const ranks = distribution(revised.map((q) => q.id)).numericRanks;
      expect(ranks[0]).toBeLessThan(10);
      expect(ranks[3]).toBeGreaterThan(0);
    },
  );
  it("diagnostic is fixed at five per section and covers all seven topics", () => {
    const qs = selectPilot("diagnostic", null, 5, "Mixed");
    expect(qs).toHaveLength(15);
    for (const s of ["PK", "PM", "PU"])
      expect(qs.filter((q) => q.section === s)).toHaveLength(5);
    expect(new Set(qs.map((q) => q.topic)).size).toBe(7);
  });
  it.each(["rasio", "aljabar", "persen"])(
    "bounds %s learning and practice to reviewed candidates",
    (topic) => {
      const guided = selectPilot("guided", topic, 5, "Mixed"),
        mini = selectPilot("mini", topic, 5, "Mixed"),
        practice = selectPilot("practice", topic, 5, "Mixed");
      expect(guided).toHaveLength(6);
      for (const d of ["Basic", "Medium", "Hard"])
        expect(guided.filter((q) => q.difficulty === d)).toHaveLength(2);
      expect(mini.filter((q) => q.difficulty === "Medium")).toHaveLength(3);
      expect(mini.filter((q) => q.difficulty === "Hard")).toHaveLength(2);
      expect(practice).toHaveLength(5);
      expect(
        new Set([...guided, ...mini, ...practice].map((q) => q.id)).size,
      ).toBeLessThanOrEqual(
        pilotManifest.learning[topic as keyof typeof pilotManifest.learning]
          .practice.length,
      );
    },
  );
  it("does not silently expand pilot scope or allow rejected revisions", () => {
    expect(() => selectPilot("practice", "pola", 5, "Mixed")).toThrow();
    expect(() => selectPilot("practice", "rasio", 20, "Mixed")).toThrow();
    const key = "rasio-1@2",
      previous = questionReviews[key];
    try {
      questionReviews[key] = { ...previous, status: "REJECTED" };
      expect(() => pilotSet(["rasio-1"])).toThrow();
    } finally {
      questionReviews[key] = previous;
    }
    vi.stubEnv("NEXT_PUBLIC_LEVELUP_PILOT_MODE", "1");
    expect(pilotMode()).toBe(true);
    vi.unstubAllEnvs();
  });
  it("exports a key-free aggregate audit, keeping human review pending", () => {
    const report = {
      readiness: "CANDIDATE_NOT_APPROVED",
      ...contentQAReport(pilotQuestions, records),
      distributions: {
        diagnostic: distribution(pilotManifest.diagnostic),
        packages: Object.fromEntries(
          Object.entries(pilotManifest.tryout).map(([k, v]) => [
            k,
            distribution(v),
          ]),
        ),
      },
      ambiguityFlags: pilotQuestions.map((q) => ({
        id: q.id,
        status:
          records[q.id]?.checks?.unambiguous === true
            ? "reviewed"
            : "human-review-pending",
      })),
    };
    expect(report.questions.every((q) => q.status === "NEEDS_REVIEW")).toBe(
      true,
    );
    expect(JSON.stringify(report)).not.toContain('"correct"');
    if (process.env.LEVELUP_PILOT_REPORT === "1") {
      mkdirSync(".reports", { recursive: true });
      writeFileSync(
        ".reports/pilot-qa.json",
        JSON.stringify(report, null, 2) + "\n",
      );
    }
  });
});

it("pilot practice prefers fresh candidate IDs before reviewed fallback", () => {
  const first = selectPilot("practice", "rasio", 5, "Mixed"),
    next = selectPilot(
      "practice",
      "rasio",
      5,
      "Mixed",
      first.map((q) => q.id),
    );
  expect(next[0].id).not.toBe(first[0].id);
  expect(next[1].id).not.toBe(first[1].id);
  expect(
    next.every((q) => pilotManifest.learning.rasio.practice.includes(q.id)),
  ).toBe(true);
});
