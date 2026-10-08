import "server-only";
import { publishedQuestions } from "../features/content/runtime";
import { selectFromBank } from "./content-selection";
export type Difficulty = "Basic" | "Medium" | "Hard";
export type Question = {
  id: string;
  version: number;
  versionId?: string;
  topic: string;
  section: string;
  difficulty: Difficulty;
  instruction?: string;
  stimulus?: string;
  stem: string;
  options: string[];
  correct: number;
  explanation: {
    understanding: string;
    concept?: string;
    known?: string;
    asked?: string;
    firstStep: string;
    solution: string;
    finalAnswer?: string;
    shortcut?: string;
    mistake: string;
    optionAnalysis?: string;
  };
  hint: string;
  media?: {
    id: string;
    role: string;
    url: string;
    alt: string;
    kind?: string;
  }[];
};
export type SelectionOptions = {
  section?: string;
  difficulty?: Difficulty | "Mixed";
  excludedIds?: string[];
  random?: (max: number) => number;
};
export async function selectQuestions(
  kind: string,
  topic?: string,
  count = 5,
  options: SelectionOptions = {},
) {
  return selectFromBank(
    await publishedQuestions(),
    kind,
    topic,
    count,
    options,
  );
}
export function publicQuestion(q: Question) {
  return {
    id: q.id,
    version: q.version,
    topic: q.topic,
    section: q.section,
    difficulty: q.difficulty,
    instruction: q.instruction,
    stimulus: q.stimulus,
    stem: q.stem,
    options: q.options,
    media: q.media?.filter((m) => m.role !== "EXPLANATION"),
  };
}
