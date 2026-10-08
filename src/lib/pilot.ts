import { StorageError } from "./store-errors";
import "server-only";
import data from "../../content/pilot-questions.json";

import manifest from "../../content/pilot-manifest.json";
import {
  effectiveQAStatus,
  isQuestionAllowed,
  questionReviews,
} from "./content-qa";
import type { Question } from "./content";
export const pilotQuestions = data as Question[];
export const pilotManifest = manifest;
export function pilotMode() {
  return process.env.NEXT_PUBLIC_LEVELUP_PILOT_MODE === "1";
}
export function pilotSet(ids: string[]) {
  return ids.map((id) => {
    const q = pilotQuestions.find((q) => q.id === id);
    if (
      !q ||
      effectiveQAStatus(q, questionReviews[`${id}@2`]) === "REJECTED" ||
      !isQuestionAllowed(q)
    )
      throw new Error("Soal pilot tidak tersedia. Hubungi pengelola.");
    return structuredClone(q);
  });
}
export function selectPilot(
  kind: string,
  topic: string | null,
  count: number,
  difficulty: string,
  excludedIds: string[] = [],
) {
  if (kind === "diagnostic") return pilotSet(manifest.diagnostic);
  const learning = manifest.learning[topic as keyof typeof manifest.learning];
  if (!learning)
    throw new StorageError(
      "Pilot belajar mencakup rasio, aljabar, dan persen.",
      400,
    );
  if (kind === "guided" || kind === "mini") return pilotSet(learning[kind]);
  if (kind !== "practice" || count !== 5 || difficulty !== "Mixed")
    throw new StorageError("Latihan pilot menggunakan 5 soal Mixed.", 400);
  const candidates = pilotSet(learning.practice),
    seen = new Set(excludedIds);
  const pool = [
    ...candidates.filter((q) => !seen.has(q.id)),
    ...candidates.filter((q) => seen.has(q.id)),
  ];
  return [
    pool.find((q) => q.difficulty === "Basic")!,
    pool.find((q) => q.difficulty === "Medium")!,
    ...pool.filter((q) => q.difficulty === "Hard").slice(0, 3),
  ];
}
