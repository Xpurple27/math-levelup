// TEST_ONLY fixtures. Never imported by production content or seeded into Supabase.
import type { Question, SelectionOptions } from "../../src/lib/content";
import { publicQuestion } from "../../src/lib/content";
import { selectFromBank } from "../../src/lib/content-selection";
export { publicQuestion };
export type { Question };
export const bank: Question[] = ["rasio", "aljabar", "statistika"].flatMap(
  (topic, s) =>
    Array.from({ length: 20 }, (_, i) => ({
      id: `${topic}-${i < 6 ? i + 1 : i < 13 ? i + 7 : i + 12}`,
      version: 1,
      topic,
      section: ["PK", "PM", "PU"][s],
      difficulty: (i < 6
        ? "Basic"
        : i < 13
          ? "Medium"
          : "Hard") as Question["difficulty"],
      stem: `TEST_ONLY fixture ${i + 1}`,
      options: ["1", "2", "3", "4"],
      correct: i % 4,
      explanation: {
        understanding: "Test fixture",
        firstStep: "Test fixture",
        solution: "Test fixture",
        mistake: "Test fixture",
      },
      hint: "Test fixture",
    })),
);
export function selectQuestions(
  kind: string,
  topic?: string,
  count = 5,
  options: SelectionOptions = {},
) {
  return selectFromBank(bank, kind, topic, count, options);
}
export function tryoutQuestions(slug: string) {
  const section = slug.slice(0, 2).toUpperCase();
  return bank
    .filter((q) => q.section === section)
    .slice(0, slug.endsWith("01-v1") ? 15 : 20);
}
export const tryoutPackages = ["pk", "pm", "pu"].flatMap((s) =>
  ["01", "02"].map((n) => ({
    slug: `${s}-${n}-v2`,
    minutes: 20,
    questionCount: 20,
  })),
);
