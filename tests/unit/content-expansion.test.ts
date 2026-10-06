import { describe, it, expect } from "vitest";
import { additionalBank } from "../../src/lib/additional-content";
import { bank, selectQuestions } from "../../src/lib/content";
import { topics } from "../../src/lib/topics";
// Independently worked answer grids: each row covers three parameter variants.
const keys: Record<string, number[][]> = {
  persen: [
    [50, 120, 210],
    [20, 40, 60],
    [90000, 135000, 180000],
    [50, 75, 100],
    [99000, 148500, 198000],
    [100000, 150000, 200000],
    [150, 300, 450],
    [25, 25, 25],
    [8, 8, 8],
    [40, 40, 40],
    [0, 0, 0],
    [20, 20, 20],
  ],
  geometri: [
    [32, 50, 72],
    [20, 24, 28],
    [30, 36, 42],
    [60, 80, 100],
    [5, 10, 15],
    [44, 88, 132],
    [4, 5, 6],
    [216, 384, 600],
    [36, 42, 48],
    [4, 9, 16],
    [68, 96, 128],
    [462, 616, 770],
  ],
  peluang: [
    [20, 30, 40],
    [2, 4, 6],
    [6, 9, 12],
    [90, 80, 70],
    [4, 9, 16],
    [12, 20, 30],
    [2, 3, 4],
    [6, 10, 15],
    [4, 9, 16],
    [10, 20, 35],
    [5, 8, 11],
    [96, 91, 84],
  ],
  pola: [
    [14, 15, 16],
    [32, 48, 64],
    [14, 18, 22],
    [25, 36, 49],
    [21, 22, 23],
    [32, 48, 64],
    [3, 3, 3],
    [23, 24, 25],
    [110, 120, 130],
    [62, 93, 124],
    [80, 88, 96],
    [4, 5, 6],
  ],
};
describe("expanded educational bank", () => {
  it("has 252 unique questions, 36 per topic, and complete module content", () => {
    expect(bank).toHaveLength(252);
    expect(new Set(bank.map((q) => q.id)).size).toBe(252);
    expect(new Set(bank.map((q) => q.stem)).size).toBe(252);
    for (const t of topics) {
      const qs = bank.filter((q) => q.topic === t.id);
      expect(qs).toHaveLength(36);
      for (const d of ["Basic", "Medium", "Hard"])
        expect(qs.filter((q) => q.difficulty === d)).toHaveLength(12);
      expect(t.recognize.length).toBeGreaterThan(30);
      expect(t.firstStep.length).toBeGreaterThan(30);
    }
  });
  it("matches independent answer grids for all 144 new questions", () => {
    for (const q of additionalBank) {
      const match = q.id.match(/-f(\d+)-v(\d+)$/)!;
      const expected =
        keys[q.topic][Number(match[1]) - 1][Number(match[2]) - 1];
      expect(Number(q.options[q.correct]), q.id).toBe(expected);
      expect(q.explanation.solution).toBeTruthy();
      expect(q.hint.length).toBeGreaterThan(15);
    }
  });
  it("balances the diagnostic across sections and covers seven subtopics", () => {
    const qs = selectQuestions("diagnostic");
    expect(qs).toHaveLength(15);
    expect(new Set(qs.map((q) => q.topic)).size).toBe(7);
    for (const section of ["PK", "PM", "PU"])
      expect(qs.filter((q) => q.section === section)).toHaveLength(5);
  });
  it("respects difficulty and count, prefers unseen questions, and avoids duplicate IDs", () => {
    for (const t of topics) {
      for (const difficulty of ["Basic", "Medium", "Hard", "Mixed"] as const) {
        const first = selectQuestions("practice", t.id, 5, {
          difficulty,
          random: () => 0,
        });
        const second = selectQuestions("practice", t.id, 5, {
          difficulty,
          excludedIds: first.map((q) => q.id),
          random: () => 0,
        });
        expect(first).toHaveLength(5);
        expect(new Set(second.map((q) => q.id)).size).toBe(5);
        expect(second.every((q) => !first.some((p) => p.id === q.id))).toBe(
          true,
        );
        if (difficulty !== "Mixed")
          expect(first.every((q) => q.difficulty === difficulty)).toBe(true);
      }
      const mixed = selectQuestions("practice", t.id, 20);
      expect(mixed).toHaveLength(20);
      expect(new Set(mixed.map((q) => q.id)).size).toBe(20);
      expect(new Set(mixed.map((q) => q.difficulty)).size).toBe(3);
    }
  });
  it("falls back to review after exhaustion and retains guided/mini composition for every topic", () => {
    for (const t of topics) {
      const pool = bank.filter((q) => q.topic === t.id),
        review = selectQuestions("practice", t.id, 10, {
          excludedIds: pool.map((q) => q.id),
        });
      expect(review).toHaveLength(10);
      expect(new Set(review.map((q) => q.id)).size).toBe(10);
      const guided = selectQuestions("guided", t.id),
        mini = selectQuestions("mini", t.id);
      for (const d of ["Basic", "Medium", "Hard"])
        expect(guided.filter((q) => q.difficulty === d)).toHaveLength(2);
      expect(mini.filter((q) => q.difficulty === "Medium")).toHaveLength(3);
      expect(mini.filter((q) => q.difficulty === "Hard")).toHaveLength(2);
    }
  });
});
