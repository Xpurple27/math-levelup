import { describe, it, expect } from "vitest";
import { bank, selectQuestions, publicQuestion } from "../../src/lib/content";
import {
  grade,
  evidence,
  updateMastery,
  masteryLabel,
} from "../../src/lib/scoring";
describe("frozen question bank", () => {
  it("provides 15 diagnostic questions, all sections, and unique correct options", () => {
    const qs = selectQuestions("diagnostic");
    expect(qs).toHaveLength(15);
    expect(new Set(qs.map((q) => q.section)).size).toBe(3);
    for (const q of bank) {
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.options[q.correct]).toBeDefined();
    }
  });
  it("keeps answers, explanations, and hints out of active assessment payloads", () => {
    for (const q of bank) {
      expect(publicQuestion(q)).not.toHaveProperty("correct");
      expect(publicQuestion(q)).not.toHaveProperty("explanation");
      expect(publicQuestion(q)).not.toHaveProperty("hint");
    }
  });
  it("assigns the required guided and mini difficulty composition", () => {
    const g = selectQuestions("guided", "rasio"),
      m = selectQuestions("mini", "rasio");
    for (const d of ["Basic", "Medium", "Hard"])
      expect(g.filter((q) => q.difficulty === d)).toHaveLength(2);
    expect(m.filter((q) => q.difficulty === "Medium")).toHaveLength(3);
    expect(m.filter((q) => q.difficulty === "Hard")).toHaveLength(2);
  });
});
describe("deterministic scoring and mastery", () => {
  const qs = selectQuestions("diagnostic");
  it("distinguishes correct, incorrect, and unanswered", () => {
    const a = {
      [qs[0].id]: qs[0].correct,
      [qs[1].id]: (qs[1].correct + 1) % 4,
    };
    expect(grade(qs, a)).toEqual({
      correct: 1,
      incorrect: 1,
      unanswered: 13,
      total: 15,
      score: 7,
    });
  });
  it("caps basic-only and medium-only evidence", () => {
    for (const [d, cap] of [
      ["Basic", 60],
      ["Medium", 80],
    ] as const) {
      const subset = bank.filter((q) => q.difficulty === d);
      const a = Object.fromEntries(subset.map((q) => [q.id, q.correct]));
      expect(evidence(subset, a)).toBe(cap);
    }
  });
  it("does not award mastered from a single perfect diagnostic", () => {
    const subset = qs.filter((q) => q.topic === "rasio"),
      a = Object.fromEntries(subset.map((q) => [q.id, q.correct]));
    const m = updateMastery(undefined, subset, a, "diagnostic");
    expect(m.value).toBe(100);
    expect(m.confidence).toBe(0.25);
    expect(masteryLabel(m)).toBe("Perlu bukti tambahan");
  });
  it("discounts correct retries and applies source weight", () => {
    const subset = selectQuestions("guided", "rasio"),
      a = Object.fromEntries(subset.map((q) => [q.id, q.correct])),
      credits = Object.fromEntries(subset.map((q) => [q.id, 0.5]));
    expect(evidence(subset, a, credits)).toBe(50);
    const old = {
      topic: "rasio",
      value: 20,
      count: 5,
      advanced: 3,
      confidence: 0.25,
    };
    expect(updateMastery(old, subset, a, "guided", credits).value).toBe(23);
  });
  it("distinguishes unknown from zero", () => {
    expect(masteryLabel()).toBe("Belum diukur");
    expect(
      masteryLabel({
        topic: "rasio",
        value: 0,
        count: 5,
        advanced: 3,
        confidence: 0.25,
      }),
    ).toBe("Foundation");
  });
});
