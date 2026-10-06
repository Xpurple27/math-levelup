import { describe, it, expect } from "vitest";
import { tryoutPackages } from "../../src/lib/tryout-packages";
import { tryoutQuestions } from "../../src/lib/tryout-content";
import { publicQuestion } from "../../src/lib/content";
describe("fixed free beta packages", () => {
  it.each(tryoutPackages)(
    "pins $slug to 15 unique version-one questions in its section",
    (pack) => {
      const questions = tryoutQuestions(pack.slug);
      expect(questions).toHaveLength(pack.questionCount);
      expect(new Set(questions.map((q) => q.id)).size).toBe(15);
      expect(
        questions.every((q) => q.version === 1 && q.section === pack.section),
      ).toBe(true);
      expect(new Set(questions.map((q) => q.topic))).toEqual(
        new Set(pack.topics),
      );
      expect(new Set(questions.map((q) => q.difficulty))).toEqual(
        new Set(["Basic", "Medium", "Hard"]),
      );
      expect(tryoutQuestions(pack.slug)).toEqual(questions);
      for (const question of questions) {
        const safe = publicQuestion(question);
        expect(safe).not.toHaveProperty("correct");
        expect(safe).not.toHaveProperty("explanation");
        expect(safe).not.toHaveProperty("hint");
      }
    },
  );
  it("rejects unknown package resources", () => {
    expect(() => tryoutQuestions("premium-forged")).toThrow(
      "Paket tidak tersedia",
    );
  });
});
