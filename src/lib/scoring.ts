import type { Question, Difficulty } from "./content";
export type Mastery = {
  topic: string;
  value: number;
  count: number;
  advanced: number;
  confidence: number;
  uniqueEvidence?: Record<string, Difficulty>;
};
export function grade(questions: Question[], answers: Record<string, number>) {
  let correct = 0,
    incorrect = 0,
    unanswered = 0;
  for (const q of questions) {
    if (answers[q.id] === undefined) unanswered++;
    else if (answers[q.id] === q.correct) correct++;
    else incorrect++;
  }
  return {
    correct,
    incorrect,
    unanswered,
    total: questions.length,
    score: Math.round((correct / questions.length) * 100),
  };
}
export function evidence(
  questions: Question[],
  answers: Record<string, number>,
  credits?: Record<string, number>,
) {
  const weights = { Basic: 1, Medium: 1.5, Hard: 2 };
  const total = questions.reduce((s, q) => s + weights[q.difficulty], 0);
  const earned = questions.reduce(
    (s, q) =>
      s +
      (answers[q.id] === q.correct
        ? weights[q.difficulty] * (credits?.[q.id] ?? 1)
        : 0),
    0,
  );
  const cap = questions.some((q) => q.difficulty === "Hard")
    ? 100
    : questions.some((q) => q.difficulty === "Medium")
      ? 80
      : 60;
  return Math.min(cap, Math.round((earned / total) * 100));
}
// Unique answered question IDs, irrespective of revision or repeated attempts.
// These weights describe evidence diversity, not calibrated exam difficulty.
const confidenceWeights = { Basic: 0.5, Medium: 1, Hard: 1.5 };
export function summarizeUniqueEvidence(
  uniqueEvidence: Record<string, Difficulty>,
) {
  const levels = Object.values(uniqueEvidence);
  return {
    count: levels.length,
    advanced: levels.filter((d) => d !== "Basic").length,
    confidence: Math.min(
      1,
      levels.reduce((sum, d) => sum + confidenceWeights[d], 0) / 20,
    ),
  };
}
export function rebuildUniqueEvidence(
  old: Mastery,
  attempts: { snapshot: Question[]; answers: Record<string, number> }[],
): Mastery {
  const uniqueEvidence: Record<string, Difficulty> = {};
  for (const a of attempts)
    for (const q of a.snapshot) {
      if (q.topic !== old.topic || !Object.hasOwn(a.answers, q.id)) continue;
      const previous = uniqueEvidence[q.id];
      if (
        !previous ||
        confidenceWeights[q.difficulty] > confidenceWeights[previous]
      )
        uniqueEvidence[q.id] = q.difficulty;
    }
  return { ...old, ...summarizeUniqueEvidence(uniqueEvidence), uniqueEvidence };
}
export function publicMastery({
  topic,
  value,
  count,
  advanced,
  confidence,
}: Mastery) {
  return { topic, value, count, advanced, confidence };
}
export function updateMastery(
  old: Mastery | undefined,
  questions: Question[],
  answers: Record<string, number>,
  kind: string,
  credits?: Record<string, number>,
): Mastery {
  const uniqueEvidence = { ...old?.uniqueEvidence };
  for (const q of questions) {
    if (!Object.hasOwn(answers, q.id)) continue;
    const previous = uniqueEvidence[q.id];
    if (
      !previous ||
      confidenceWeights[q.difficulty] > confidenceWeights[previous]
    )
      uniqueEvidence[q.id] = q.difficulty;
  }
  const { count, advanced, confidence } =
    summarizeUniqueEvidence(uniqueEvidence);
  const weight =
    (
      {
        diagnostic: 0.3,
        guided: 0.1,
        mini: 0.35,
        practice: 0.2,
        tryout: 0.35,
      } as Record<string, number>
    )[kind] ?? 0.2;
  const e = evidence(questions, answers, credits),
    alpha = weight * Math.min(1, questions.length / 5);
  return {
    topic: questions[0].topic,
    value: old ? Math.round((1 - alpha) * old.value + alpha * e) : e,
    count,
    advanced,
    confidence,
    uniqueEvidence,
  };
}
export function masteryLabel(m?: Mastery) {
  if (!m) return "Belum diukur";
  if (m.value >= 80)
    return m.confidence >= 0.7 && m.advanced >= 8
      ? "Mastered"
      : "Perlu bukti tambahan";
  return m.value >= 60
    ? "Proficient"
    : m.value >= 40
      ? "Developing"
      : "Foundation";
}
