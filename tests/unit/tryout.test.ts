import { describe, it, expect } from "vitest";
import { tryoutPackages } from "../../src/lib/tryout-packages";
import { tryoutQuestions } from "../../src/lib/tryout-content";
import { publicQuestion } from "../../src/lib/content";
describe("fixed free beta packages", () => {
  it.each(tryoutPackages)(
    "pins $slug to 20 unique version-one questions in its section",
    (pack) => {
      const questions = tryoutQuestions(pack.slug);
      expect(questions).toHaveLength(pack.questionCount);
      expect(new Set(questions.map((q) => q.id)).size).toBe(20);
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
  it.each(["pk", "pm", "pu"])(
    "gives %s Package 02 separate questions and metadata",
    (section) => {
      const first = tryoutQuestions(`${section}-01-v2`);
      const second = tryoutQuestions(`${section}-02-v1`);
      expect(
        second.some((q) =>
          first.some((old) => old.id === q.id || old.stem === q.stem),
        ),
      ).toBe(false);
      const pack = tryoutPackages.find((p) => p.slug === `${section}-02-v1`)!;
      expect(pack.questionCount).toBe(20);
      expect(pack.minutes).toBe(20);
    },
  );
  it("preserves the legacy package assignments", () => {
    const old = tryoutQuestions("pk-01-v1");
    expect(old).toHaveLength(15);
    expect(tryoutQuestions("pk-01-v2").slice(0, 15)).toEqual(old);
  });
  it("rejects unknown package resources", () => {
    expect(() => tryoutQuestions("premium-forged")).toThrow(
      "Paket tidak tersedia",
    );
  });
});
