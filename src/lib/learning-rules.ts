export function attemptDurationMs(kind: string, _topic: string | null) {
  void _topic; // Legacy callers retain their frozen package/topic argument.
  if (!["diagnostic", "mini", "guided", "practice", "tryout"].includes(kind))
    throw new Error("Jenis sesi tidak valid.");
  if (kind === "diagnostic") return 30 * 60000;
  if (kind === "mini") return 10 * 60000;
  if (kind === "tryout") return 20 * 60000; // Creation is catalog-gated by the assessment API.
  return null;
}
export function learningDay(now = Date.now()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(
    now,
  );
}
export function activityQualifies(
  kind: string,
  answers: Record<string, number>,
) {
  return kind !== "practice" || Object.keys(answers).length >= 5;
}
export function streakForDays(days: string[], now = Date.now()) {
  const today = learningDay(now);
  let cursor = Date.parse(today + "T00:00:00Z");
  if (!days.includes(today)) cursor -= 86400000;
  let streak = 0;
  const set = new Set(days);
  while (set.has(new Date(cursor).toISOString().slice(0, 10))) {
    streak++;
    cursor -= 86400000;
  }
  return streak;
}
