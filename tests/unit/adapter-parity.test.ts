import { PGlite } from "@electric-sql/pglite";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { bank, selectQuestions, type Question } from "../../src/lib/content";
import { tryoutPackages } from "../../src/lib/tryout-packages";
import { tryoutQuestions } from "../../src/lib/tryout-content";
import { grade, updateMastery, type Mastery } from "../../src/lib/scoring";
import {
  learningDay,
  streakForDays,
  attemptDurationMs,
} from "../../src/lib/learning-rules";
import { StorageError } from "../../src/lib/store-errors";
import type { Attempt } from "../../src/lib/store-types";
let local: typeof import("../../src/lib/store-local"),
  pg: PGlite,
  sqlite: DatabaseSync;
const dir = mkdtempSync(join(tmpdir(), "levelup-parity-"));
beforeAll(async () => {
  vi.stubEnv("LEVELUP_DATA_DIR", dir);
  local = await import("../../src/lib/store-local");
  sqlite = new DatabaseSync(join(dir, "levelup.sqlite"));
  pg = new PGlite();
  await pg.exec(
    "CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY)",
  );
  for (const file of readdirSync("supabase/migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await pg.exec(readFileSync(join("supabase/migrations", file), "utf8"));
}, 30000);
afterAll(async () => {
  sqlite.close();
  await pg.close();
  vi.unstubAllEnvs();
  rmSync(dir, { recursive: true, force: true });
});
async function fixture(mode: string) {
  const user =
    mode === "SQLite"
      ? local.createUser(
          `${randomUUID()}@example.com`,
          "Fixture",
          "fixture-only-password",
          "Kelas 12",
          700,
        ).id
      : randomUUID();
  if (mode === "Postgres")
    await pg.query("INSERT INTO auth.users VALUES($1)", [user]);
  return {
    user,
    async create(kind: string, topic: string | null, qs: Question[]) {
      if (mode === "SQLite") return local.createAttempt(user, kind, topic, qs);
      return (
        await pg.query<{ a: Attempt }>(
          "SELECT public.levelup_start_attempt($1,$2,$3,$4) a",
          [user, kind, topic, JSON.stringify(qs)],
        )
      ).rows[0].a;
    },
    async get(id: string, owner = user) {
      if (mode === "SQLite") return local.getAttempt(id, owner);
      return (
        (
          await pg.query<{ a: Attempt }>(
            "SELECT to_jsonb(a) a FROM public.levelup_attempts a WHERE id=$1 AND user_id=$2",
            [id, owner],
          )
        ).rows[0]?.a ?? null
      );
    },
    async save(a: Attempt) {
      if (mode === "SQLite") return local.saveAttempt(a);
      const saved = (
        await pg.query<{ saved: boolean }>(
          "SELECT public.levelup_save_attempt($1,$2,$3,$4,$5,$6) saved",
          [
            a.id,
            a.user_id,
            a.revision,
            JSON.stringify(a.answers),
            JSON.stringify(a.feedback),
            JSON.stringify(a.credits),
          ],
        )
      ).rows[0].saved;
      if (!saved) throw new StorageError("Stale/late save", 409);
      a.revision++;
    },
    async mastery() {
      if (mode === "SQLite") return local.getMastery(user);
      return (
        await pg.query<{ data: Mastery }>(
          "SELECT data FROM public.levelup_mastery WHERE user_id=$1 ORDER BY topic",
          [user],
        )
      ).rows.map((r) => r.data);
    },
    async finish(a: Attempt, masteries: Mastery[], old: Mastery[]) {
      if (mode === "SQLite")
        return local.finalize(a, grade(a.snapshot, a.answers), masteries, old);
      return (
        await pg.query<{ done: boolean }>(
          "SELECT public.levelup_finalize_attempt($1,$2,$3,$4,$5,$6) done",
          [
            a.id,
            a.user_id,
            a.revision,
            JSON.stringify(grade(a.snapshot, a.answers)),
            JSON.stringify(masteries),
            JSON.stringify(Object.fromEntries(old.map((m) => [m.topic, m]))),
          ],
        )
      ).rows[0].done;
    },
    async expire(id: string) {
      if (mode === "SQLite") {
        sqlite
          .prepare("UPDATE attempts SET deadline=0 WHERE id=? AND user_id=?")
          .run(id, user);
        return;
      }
      await pg.query(
        "UPDATE public.levelup_attempts SET deadline=0 WHERE id=$1 AND user_id=$2",
        [id, user],
      );
    },
    async days() {
      if (mode === "SQLite") return local.progress(user).days;
      return (
        await pg.query<{ learning_day: string }>(
          "SELECT to_char(day,'YYYY-MM-DD') AS learning_day FROM public.levelup_activities WHERE user_id=$1",
          [user],
        )
      ).rows.map((r) => r.learning_day);
    },
  };
}
// Exercise the actual SQLite adapter and production Postgres RPCs against the same contracts.
// Auth transport/cookies and Supabase networking are covered separately, not simulated as live access.
describe.each(["SQLite", "Postgres"])(
  "%s learning storage contract",
  (mode) => {
    it("atomically resumes one active attempt and freezes selected content", async () => {
      const f = await fixture(mode),
        qs = structuredClone(selectQuestions("diagnostic"));
      const [a, b] = await Promise.all([
        f.create("diagnostic", null, qs),
        f.create("diagnostic", null, qs),
      ]);
      expect(a.id).toBe(b.id);
      expect(a.deadline! - a.started).toBe(1800000);
      const stem = a.snapshot[0].stem;
      qs[0].stem = "changed fixture input";
      expect((await f.get(a.id))!.snapshot[0].stem).toBe(stem);
      expect(await f.get(a.id, randomUUID())).toBeNull();
      for (const pack of tryoutPackages) {
        const packageAttempt = await f.create(
          "tryout",
          pack.slug,
          tryoutQuestions(pack.slug),
        );
        expect(packageAttempt.id).not.toBe(a.id);
        expect(packageAttempt.snapshot).toHaveLength(20);
        expect(packageAttempt.deadline! - packageAttempt.started).toBe(
          attemptDurationMs("tryout", pack.slug),
        );
      }
      for (const kind of ["guided", "mini", "practice"]) {
        const activity = await f.create(
          kind,
          "rasio",
          selectQuestions(kind, "rasio"),
        );
        expect(
          activity.deadline === null
            ? null
            : activity.deadline - activity.started,
        ).toBe(attemptDurationMs(kind, "rasio"));
      }
    });
    it("rejects stale, foreign-owner and late autosaves with no overwrite", async () => {
      const f = await fixture(mode),
        a = await f.create("diagnostic", null, selectQuestions("diagnostic")),
        stale = structuredClone(a);
      a.answers[a.snapshot[0].id] = 0;
      await f.save(a);
      expect(a.revision).toBe(1);
      stale.answers[stale.snapshot[0].id] = 1;
      await expect(f.save(stale)).rejects.toMatchObject({ status: 409 });
      const fresh = (await f.get(a.id))!;
      await expect(
        f.save({ ...fresh, user_id: randomUUID() }),
      ).rejects.toMatchObject({ status: 409 });
      expect((await f.get(a.id))!.answers[a.snapshot[0].id]).toBe(0);
      await f.expire(a.id);
      await expect(f.save(fresh)).rejects.toMatchObject({ status: 409 });
    });
    it("finalizes once, preserves results, and guards concurrent mastery changes", async () => {
      const f = await fixture(mode),
        a = await f.create("mini", "rasio", selectQuestions("mini", "rasio"));
      const old = await f.mastery();
      for (const q of a.snapshot) a.answers[q.id] = q.correct;
      await f.save(a);
      const m = updateMastery(undefined, a.snapshot, a.answers, "mini");
      expect(await f.finish(a, [m], old)).toBe(true);
      const completed = (await f.get(a.id))!;
      expect(completed.result?.score).toBe(100);
      expect(await f.finish(a, [{ ...m, value: 0 }], old)).toBe(false);
      await expect(f.save({ ...a, answers: {} })).rejects.toMatchObject({
        status: 409,
      });
      expect(await f.get(a.id)).toEqual(completed);
      const before = await f.mastery();
      const first = await f.create(
          "diagnostic",
          null,
          selectQuestions("diagnostic"),
        ),
        second = await f.create(
          "mini",
          "rasio",
          selectQuestions("mini", "rasio"),
        );
      const next = updateMastery(
        before.find((m) => m.topic === "rasio"),
        second.snapshot,
        second.answers,
        "mini",
      );
      await f.finish(second, [next], before);
      await expect(f.finish(first, [], before)).rejects.toThrow();
      expect((await f.get(first.id))!.status).toBe("active");
      expect((await f.mastery()).find((m) => m.topic === "rasio")).toEqual(
        next,
      );
      expect(await f.days()).toEqual([learningDay()]);
    });
    it("requires five practice answers for a learning day and retains unique evidence across repeats", async () => {
      const f = await fixture(mode),
        qs = bank.filter((q) => q.topic === "rasio").slice(0, 5);
      for (const amount of [4, 5, 5]) {
        const a = await f.create("practice", "rasio", qs),
          old = await f.mastery();
        for (const q of qs.slice(0, amount)) a.answers[q.id] = q.correct;
        await f.save(a);
        const m = updateMastery(
          old.find((m) => m.topic === "rasio"),
          qs,
          a.answers,
          "practice",
        );
        await f.finish(a, [m], old);
        expect(await f.days()).toEqual(amount < 5 ? [] : [learningDay()]);
        expect(m.count).toBe(amount);
        expect(m.confidence).toBe((amount * 0.5) / 20);
      }
    });
  },
);
it("counts streaks on Jakarta days across midnight and gaps", () => {
  const before = Date.parse("2026-10-06T16:59:59Z"),
    after = before + 1000;
  expect(learningDay(before)).toBe("2026-10-06");
  expect(learningDay(after)).toBe("2026-10-07");
  expect(streakForDays(["2026-10-05", "2026-10-06"], after)).toBe(2);
  expect(streakForDays(["2026-10-05"], after)).toBe(0);
  expect(streakForDays(["2026-10-07", "2026-10-06", "2026-10-06"], after)).toBe(
    2,
  );
});

it("backfills legacy unique evidence identically without rewriting scores or mastery values", async () => {
  const f = await fixture("SQLite");
  await pg.query("INSERT INTO auth.users VALUES($1)", [f.user]);
  const qs = [
    bank.find((q) => q.id === "rasio-1")!,
    bank.find((q) => q.id === "rasio-13")!,
    bank.find((q) => q.id === "rasio-25")!,
  ];
  const answers = { [qs[0].id]: 0, [qs[2].id]: 0 };
  const legacy = {
    topic: "rasio",
    value: 83,
    count: 90,
    advanced: 60,
    confidence: 1,
  };
  sqlite
    .prepare("INSERT INTO mastery VALUES(?,?,?)")
    .run(f.user, "rasio", JSON.stringify(legacy));
  await pg.query("INSERT INTO public.levelup_mastery VALUES($1,'rasio',$2)", [
    f.user,
    JSON.stringify(legacy),
  ]);
  for (let i = 0; i < 2; i++) {
    const id = randomUUID(),
      result = grade(qs, answers);
    sqlite
      .prepare(
        "INSERT INTO attempts(id,user_id,kind,topic,started,snapshot,answers,status,result) VALUES(?,?,'diagnostic',NULL,?,?,?,?,?)",
      )
      .run(
        id,
        f.user,
        Date.now(),
        JSON.stringify(qs),
        JSON.stringify(answers),
        "completed",
        JSON.stringify(result),
      );
    await pg.query(
      "INSERT INTO public.levelup_attempts(id,user_id,kind,started,snapshot,answers,status,result) VALUES($1,$2,'diagnostic',$3,$4,$5,'completed',$6)",
      [
        id,
        f.user,
        Date.now(),
        JSON.stringify(qs),
        JSON.stringify(answers),
        JSON.stringify(result),
      ],
    );
  }
  const before = sqlite
    .prepare(
      "SELECT snapshot,answers,result FROM attempts WHERE user_id=? ORDER BY id",
    )
    .all(f.user);
  vi.resetModules();
  local = await import("../../src/lib/store-local");
  const sql = readFileSync(
    "supabase/migrations/202610070001_unique_mastery_evidence.sql",
    "utf8",
  );
  await pg.exec(sql);
  await pg.exec(sql);
  const upgraded = local.getMastery(f.user)[0];
  expect(upgraded).toEqual(
    (
      await pg.query<{ data: Mastery }>(
        "SELECT data FROM public.levelup_mastery WHERE user_id=$1",
        [f.user],
      )
    ).rows[0].data,
  );
  expect(upgraded).toMatchObject({
    value: 83,
    count: 2,
    advanced: 1,
    confidence: 0.1,
  });
  expect(upgraded.uniqueEvidence).toEqual({
    "rasio-1": "Basic",
    "rasio-25": "Hard",
  });
  expect(
    sqlite
      .prepare(
        "SELECT snapshot,answers,result FROM attempts WHERE user_id=? ORDER BY id",
      )
      .all(f.user),
  ).toEqual(before);
  expect(
    (
      await pg.query<{ snapshot: unknown; answers: unknown; result: unknown }>(
        "SELECT snapshot,answers,result FROM public.levelup_attempts WHERE user_id=$1 ORDER BY id",
        [f.user],
      )
    ).rows,
  ).toEqual(
    before.map((r) => ({
      snapshot: JSON.parse(r.snapshot as string),
      answers: JSON.parse(r.answers as string),
      result: JSON.parse(r.result as string),
    })),
  );
});
