import { randomInt } from "node:crypto";
import type { Question, Difficulty, SelectionOptions } from "./content";
import { StorageError } from "./store-errors";
export function selectFromBank(
  bank: Question[],
  kind: string,
  topic?: string,
  count = 5,
  options: SelectionOptions = {},
) {
  const seen = new Set(options.excludedIds || []),
    random = options.random ?? randomInt;
  const shuffle = <T>(values: T[]) => {
    const out = [...values];
    for (let i = out.length - 1; i > 0; i--) {
      const j = random(i + 1);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };
  const pick = (pool: Question[], n: number) => {
    if (pool.length < n)
      throw new StorageError(
        "Belum cukup soal published untuk sesi ini. Konten sedang disiapkan.",
        400,
      );
    return [
      ...shuffle(pool.filter((q) => !seen.has(q.id))),
      ...shuffle(pool.filter((q) => seen.has(q.id))),
    ].slice(0, n);
  };
  if (kind === "diagnostic") {
    const quotas = [
      ["PK", 2, 2, 1],
      ["PM", 2, 2, 1],
      ["PU", 1, 2, 2],
    ] as const;
    return shuffle(
      quotas.flatMap(([section, basic, medium, hard]) =>
        [
          ["Basic", basic],
          ["Medium", medium],
          ["Hard", hard],
        ].flatMap(([difficulty, n]) =>
          pick(
            bank.filter(
              (q) => q.section === section && q.difficulty === difficulty,
            ),
            Number(n),
          ),
        ),
      ),
    );
  }
  const pool = bank.filter(
      (q) =>
        q.topic === topic &&
        (!options.section ||
          options.section === "All" ||
          q.section === options.section),
    ),
    level = (d: Difficulty, n: number) =>
      pick(
        pool.filter((q) => q.difficulty === d),
        n,
      );
  if (kind === "guided")
    return (["Basic", "Medium", "Hard"] as const).flatMap((d) => level(d, 2));
  if (kind === "mini")
    return shuffle([...level("Medium", 3), ...level("Hard", 2)]);
  if (options.difficulty && options.difficulty !== "Mixed")
    return shuffle(level(options.difficulty, count));
  const basic = Math.floor(count / 3),
    medium = Math.floor(count / 3);
  return shuffle([
    ...level("Basic", basic),
    ...level("Medium", medium),
    ...level("Hard", count - basic - medium),
  ]);
}
