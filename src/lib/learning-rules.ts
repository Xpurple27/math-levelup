import { findTryoutPackage } from "./tryout-packages";
export function attemptDurationMs(kind: string, topic: string | null) {
  if (!["diagnostic", "mini", "guided", "practice", "tryout"].includes(kind))
    throw new Error("Jenis sesi tidak valid.");
  if (kind === "diagnostic") return 30 * 60000;
  if (kind === "mini") return 10 * 60000;
  if (kind === "tryout") {
    const pack = findTryoutPackage(topic);
    if (!pack) throw new Error("Paket tidak tersedia.");
    return pack.minutes * 60000;
  }
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
