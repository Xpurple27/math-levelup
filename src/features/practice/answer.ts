import "server-only";
import type { Attempt } from "@/lib/store";
import type { Question } from "@/lib/content";
// Called only after verified ownership, deadline and option validation.
export function applyPracticeAnswer(a: Attempt, q: Question, selected: number) {
  const previous = a.feedback[q.id];
  if (previous?.done) return false;
  const tries = (previous?.tries ?? 0) + 1,
    correct = selected === q.correct,
    done = correct || a.kind === "practice" || tries >= 2;
  a.feedback[q.id] = { tries, done, correct, selected: selected };
  if (done) {
    a.answers[q.id] = selected;
    a.credits[q.id] = tries > 1 ? 0.5 : 1;
  }
  return true;
}
