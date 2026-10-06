import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { tryoutQuestions } from "../../src/lib/tryout-content";
import { selectQuestions } from "../../src/lib/content";
let db: PGlite;
const user = "00000000-0000-4000-8000-000000000001",
  other = "00000000-0000-4000-8000-000000000002";
async function start(kind = "diagnostic") {
  const r = await db.query<{
    a: { id: string; started: number; deadline: number; revision: number };
  }>("SELECT public.levelup_start_attempt($1,$2,$3,$4) a", [
    user,
    kind,
    kind === "diagnostic" ? null : "rasio",
    JSON.stringify(selectQuestions(kind, "rasio")),
  ]);
  return r.rows[0].a;
}
async function finish(
  id: string,
  version: number,
  masteries: unknown[] = [],
  old = {},
) {
  return db.query<{ done: boolean }>(
    "SELECT public.levelup_finalize_attempt($1,$2,$3,$4,$5,$6) done",
    [
      id,
      user,
      version,
      JSON.stringify({
        score: 0,
        correct: 0,
        incorrect: 0,
        unanswered: 15,
        total: 15,
      }),
      JSON.stringify(masteries),
      JSON.stringify(old),
    ],
  );
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    `CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY);INSERT INTO auth.users VALUES('${user}'),('${other}');`,
  );
  await db.exec(
    readFileSync(
      "supabase/migrations/202610060001_online_learning.sql",
      "utf8",
    ),
  );
  await db.exec(
    readFileSync(
      "supabase/migrations/202610060002_tryout_packages.sql",
      "utf8",
    ),
  );
}, 30000);
afterAll(async () => {
  await db.close();
});
describe("Postgres migration and trusted write boundaries", () => {
  it("is replayable and default-denies table and function access to browser roles", async () => {
    await db.exec(
      readFileSync(
        "supabase/migrations/202610060001_online_learning.sql",
        "utf8",
      ),
    );
    await db.exec(
      readFileSync(
        "supabase/migrations/202610060002_tryout_packages.sql",
        "utf8",
      ),
    );
    await db.exec(
      readFileSync(
        "supabase/migrations/202610060002_tryout_packages.sql",
        "utf8",
      ),
    );
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`SET ROLE ${role}`);
      try {
        await expect(
          db.query("SELECT snapshot FROM public.levelup_attempts"),
        ).rejects.toThrow(/permission denied/);
        await expect(start()).rejects.toThrow(/permission denied/);
      } finally {
        await db.exec("RESET ROLE");
      }
    }
    const r = await db.query<{ relrowsecurity: boolean }>(
      "SELECT relrowsecurity FROM pg_class WHERE relname IN ('levelup_attempts','levelup_mastery','levelup_activities')",
    );
    expect(r.rows).toHaveLength(3);
    expect(r.rows.every((r) => r.relrowsecurity)).toBe(true);
  });
  it("uses database deadlines, resumes the same attempt, and rejects stale/late saves", async () => {
    await db.exec("SET ROLE service_role");
    try {
      const a = await start(),
        resumed = await start();
      expect(a.id).toBe(resumed.id);
      expect(a.deadline - a.started).toBe(1800000);
      const args = [
        a.id,
        user,
        0,
        JSON.stringify({ "rasio-1": 0 }),
        "{}",
        "{}",
      ];
      const saved = await db.query<{ saved: boolean }>(
        "SELECT public.levelup_save_attempt($1,$2,$3,$4,$5,$6) saved",
        args,
      );
      expect(saved.rows[0].saved).toBe(true);
      expect(
        (
          await db.query<{ saved: boolean }>(
            "SELECT public.levelup_save_attempt($1,$2,$3,$4,$5,$6) saved",
            args,
          )
        ).rows[0].saved,
      ).toBe(false);
      await db.query(
        "UPDATE public.levelup_attempts SET deadline=0 WHERE id=$1",
        [a.id],
      );
      args[2] = 1;
      expect(
        (
          await db.query<{ saved: boolean }>(
            "SELECT public.levelup_save_attempt($1,$2,$3,$4,$5,$6) saved",
            args,
          )
        ).rows[0].saved,
      ).toBe(false);
      await expect(
        db.query("SELECT public.levelup_finalize_attempt($1,$2,1,$3,$4,$5)", [
          a.id,
          other,
          "{}",
          "[]",
          "{}",
        ]),
      ).rejects.toThrow(/attempt not found/);
    } finally {
      await db.exec("RESET ROLE");
    }
  });
  it("finalizes atomically once and refuses stale mastery updates", async () => {
    const a = await start();
    const m = {
      topic: "rasio",
      value: 50,
      count: 5,
      advanced: 3,
      confidence: 0.25,
    };
    expect((await finish(a.id, 1, [m])).rows[0].done).toBe(true);
    expect((await finish(a.id, 1, [{ ...m, value: 100 }])).rows[0].done).toBe(
      false,
    );
    const count = await db.query<{ n: number }>(
      "SELECT count(*)::integer n FROM public.levelup_activities",
    );
    expect(count.rows[0].n).toBe(1);
    const second = await start("mini");
    await expect(finish(second.id, 0, [m])).rejects.toThrow(
      /concurrent update/,
    );
    const status = await db.query<{ status: string }>(
      "SELECT status FROM public.levelup_attempts WHERE id=$1",
      [second.id],
    );
    expect(status.rows[0].status).toBe("active");
    expect((await finish(second.id, 0, [m], { rasio: m })).rows[0].done).toBe(
      true,
    );
  });
  it("creates a timed package attempt and resumes only the same owner/package", async () => {
    await db.exec("SET ROLE service_role");
    try {
      const args = [
        user,
        "tryout",
        "pk-01-v1",
        JSON.stringify(tryoutQuestions("pk-01-v1")),
      ];
      const query = () =>
        db.query<{
          a: { id: string; started: number; deadline: number; topic: string };
        }>("SELECT public.levelup_start_attempt($1,$2,$3,$4) a", args);
      const a = (await query()).rows[0].a;
      expect(a.deadline - a.started).toBe(1800000);
      expect(a.topic).toBe("pk-01-v1");
      expect((await query()).rows[0].a.id).toBe(a.id);
      args[0] = other;
      expect((await query()).rows[0].a.id).not.toBe(a.id);
      args[2] = "invalid-package";
      await expect(query()).rejects.toThrow("invalid package");
    } finally {
      await db.exec("RESET ROLE");
    }
  });
});
