import "server-only";
import { createHash } from "node:crypto";
import reviews from "../../content/question-qa.json";
import type { Question } from "./content";
export const qaChecks = [
  "distractorPlausibility",
  "answerPattern",
  "stemClarity",
  "answerKey",
  "explanation",
  "difficulty",
  "subtopic",
  "sectionMapping",
  "unambiguous",
  "duplicateReview",
  "familyVariant",
] as const;
export type QAStatus = "VALID" | "NEEDS_REVIEW" | "REJECTED";
export type QARecord = {
  status: QAStatus;
  contentHash: string;
  family: string;
  variant: string;
  checks?: Partial<Record<(typeof qaChecks)[number], boolean>>;
  reviewer?: string;
  reviewedAt?: string;
  notes?: string;
};
export const questionReviews = reviews as Record<string, QARecord>;
export function questionContentHash(question: Question) {
  return createHash("sha256").update(JSON.stringify(question)).digest("hex");
}
export function structuralIssues(q: Question) {
  const issues: string[] = [];
  if (!q.stem.trim()) issues.push("empty-stem");
  if (
    !Number.isInteger(q.correct) ||
    q.correct < 0 ||
    q.correct >= q.options.length
  )
    issues.push("invalid-key-index");
  if (
    q.options.length !== 4 ||
    new Set(q.options.map((s) => s.trim().toLowerCase())).size !== 4
  )
    issues.push("invalid-options");
  if (
    !q.explanation.firstStep.trim() ||
    !q.explanation.solution.trim() ||
    !q.explanation.understanding.trim()
  )
    issues.push("incomplete-explanation");
  if (!["Basic", "Medium", "Hard"].includes(q.difficulty))
    issues.push("invalid-difficulty");
  return issues;
}
export function effectiveQAStatus(
  q: Question,
  record: QARecord | undefined = questionReviews[`${q.id}@${q.version}`] ??
    questionReviews[q.id],
): QAStatus {
  if (record?.status === "REJECTED") return "REJECTED";
  if (
    record?.status !== "VALID" ||
    record.contentHash !== questionContentHash(q) ||
    structuralIssues(q).length ||
    !record.family ||
    !record.variant ||
    !record.reviewer?.trim() ||
    !record.reviewedAt ||
    !Number.isFinite(Date.parse(record.reviewedAt)) ||
    !qaChecks.every((check) => record.checks?.[check] === true)
  )
    return "NEEDS_REVIEW";
  return "VALID";
}
// Pending seed content stays available for the current beta; rejection prevents NEW exposure.
// Existing attempt snapshots are deliberately not revalidated or rewritten.
export function isQuestionAllowed(q: Question) {
  return effectiveQAStatus(q) !== "REJECTED";
}
export function questionFamily(q: Question) {
  const variant = q.id.match(/^(.*)-v(\d+)$/);
  if (variant) return { family: variant[1], variant: variant[2] };
  return {
    family: `${q.topic}-${q.difficulty.toLowerCase()}-template`,
    variant: q.id,
  };
}
export function contentQAReport(
  bank: Question[],
  records: Record<string, QARecord> = questionReviews,
) {
  const exact = new Map<string, string[]>(),
    near = new Map<string, string[]>();
  for (const q of bank) {
    const stem = q.stem.trim().toLowerCase().replace(/\s+/g, " ");
    const pattern = stem.replace(/\d+(?:[.,]\d+)?/g, "#");
    exact.set(stem, [...(exact.get(stem) || []), q.id]);
    near.set(pattern, [...(near.get(pattern) || []), q.id]);
  }
  const questions = bank.map((q) => ({
    id: q.id,
    version: q.version,
    status: effectiveQAStatus(q, records[q.id]),
    family: records[q.id]?.family,
    variant: records[q.id]?.variant,
    issues: structuralIssues(q),
    contentChanged: records[q.id]?.contentHash !== questionContentHash(q),
  }));
  const numeric = bank.filter((q) =>
    q.options.every(
      (option) => option.trim() !== "" && Number.isFinite(Number(option)),
    ),
  );
  const numericOptionPattern = {
    numericQuestionCount: numeric.length,
    minimumKeyCount: numeric.filter(
      (q) =>
        Number(q.options[q.correct]) === Math.min(...q.options.map(Number)),
    ).length,
    maximumKeyCount: numeric.filter(
      (q) =>
        Number(q.options[q.correct]) === Math.max(...q.options.map(Number)),
    ).length,
    note: "Aggregate cue check only; independent human review of distractors remains required.",
  };
  return {
    total: bank.length,
    numericOptionPattern,
    byStatus: Object.fromEntries(
      (["VALID", "NEEDS_REVIEW", "REJECTED"] as const).map((status) => [
        status,
        questions.filter((q) => q.status === status).length,
      ]),
    ),
    exactDuplicates: [...exact.values()].filter((ids) => ids.length > 1),
    nearDuplicates: [...near.values()].filter((ids) => ids.length > 1),
    questions,
  };
}
