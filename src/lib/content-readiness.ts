import type { Question } from "./content";
import { selectFromBank } from "./content-selection";

/** Resolve every pinned version, preserving order. Never silently shorten a set. */
export function resolveQuestionSet(
  ids: string[],
  bank: Question[],
  section?: string,
) {
  const versions = new Map(bank.map((q) => [q.versionId, q]));
  const questions = ids.map((id) => versions.get(id));
  if (
    !ids.length ||
    questions.some((q) => !q || (section && q.section !== section))
  )
    return null;
  const resolved = questions as Question[];
  if (new Set(resolved.map((q) => q.id)).size !== ids.length) return null;
  return resolved;
}

export function selectionReadiness(bank: Question[]) {
  function available(kind: string, topic?: string) {
    try {
      selectFromBank(bank, kind, topic, 5, { random: () => 0 });
      return true;
    } catch {
      return false;
    }
  }
  return {
    diagnosticReady: available("diagnostic"),
    miniCoverage: [...new Set(bank.map((q) => q.topic))].filter((topic) =>
      available("mini", topic),
    ),
  };
}
