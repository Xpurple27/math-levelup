import { PGlite } from "@electric-sql/pglite";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, afterAll, it, expect, vi } from "vitest";
import { tryoutQuestions } from "../../src/lib/tryout-content";
let pg: PGlite,
  local: typeof import("../../src/lib/store-local"),
  sqlite: DatabaseSync;
const dir = mkdtempSync(join(tmpdir(), "levelup-reports-")),
  user = "00000000-0000-4000-8000-000000000010",
  other = "00000000-0000-4000-8000-000000000011";
beforeAll(async () => {
  vi.stubEnv("LEVELUP_DATA_DIR", dir);
  local = await import("../../src/lib/store-local");
  sqlite = new DatabaseSync(join(dir, "levelup.sqlite"));
  pg = new PGlite();
  await pg.exec(
    `CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY);INSERT INTO auth.users VALUES('${user}'),('${other}');`,
  );
  for (const f of readdirSync("supabase/migrations").sort())
    await pg.exec(readFileSync(join("supabase/migrations", f), "utf8"));
}, 30000);
afterAll(async () => {
  sqlite.close();
  await pg.close();
  vi.unstubAllEnvs();
  rmSync(dir, { recursive: true, force: true });
});
it("Postgres report owns its context, deduplicates, and preserves the attempt", async () => {
  const a = (
    await pg.query<{ a: { id: string; started: number; deadline: number } }>(
      "SELECT public.levelup_start_attempt($1,'tryout','pk-pilot-v1',$2) a",
      [user, JSON.stringify(tryoutQuestions("pk-pilot-v1"))],
    )
  ).rows[0].a;
  expect(a.deadline - a.started).toBe(1200000);
  const before = (
    await pg.query("SELECT * FROM public.levelup_attempts WHERE id=$1", [a.id])
  ).rows;
  const args = [user, a.id, "rasio-1", "question", "exam", "Test-only report"];
  const report = () =>
    pg.query("SELECT public.levelup_report_issue($1,$2,$3,$4,$5,$6)", args);
  await report();
  await report();
  const rows = (
    await pg.query<{ context: Record<string, unknown> }>(
      "SELECT context FROM public.levelup_reports",
    )
  ).rows;
  expect(rows).toHaveLength(1);
  expect(rows[0].context).toEqual({
    version: 2,
    topic: "rasio",
    kind: "tryout",
    package: "pk-pilot-v1",
    status: "active",
  });
  expect(rows[0].context).not.toHaveProperty("correct");
  expect(
    (
      await pg.query("SELECT * FROM public.levelup_attempts WHERE id=$1", [
        a.id,
      ])
    ).rows,
  ).toEqual(before);
  args[0] = other;
  await expect(report()).rejects.toThrow(/attempt not found/);
  args[0] = user;
  args[2] = "forged-question";
  await expect(report()).rejects.toThrow(/invalid question context/);
  args[2] = "rasio-1";
  args[4] = "solutions";
  await expect(report()).rejects.toThrow(/invalid question context/);
  args[4] = "exam";
  args[5] = "x".repeat(1001);
  await expect(report()).rejects.toThrow(/invalid report/);
  for (const role of ["anon", "authenticated"]) {
    await pg.exec(`SET ROLE ${role}`);
    try {
      await expect(
        pg.query("SELECT * FROM public.levelup_reports"),
      ).rejects.toThrow(/permission denied/);
      await expect(report()).rejects.toThrow(/permission denied/);
    } finally {
      await pg.exec("RESET ROLE");
    }
  }
  await pg.exec(
    readFileSync("supabase/migrations/202610070002_pilot_reports.sql", "utf8"),
  );
  expect(
    (await pg.query("SELECT * FROM public.levelup_reports")).rows,
  ).toHaveLength(1);
});
it("SQLite contextual reports have the same boundaries", () => {
  const u = local.createUser(
    "pilot-local@example.com",
    "Fixture",
    "test-only-password",
    "Kelas 12",
    700,
  );
  const a = local.createAttempt(
      u.id,
      "tryout",
      "pk-pilot-v1",
      tryoutQuestions("pk-pilot-v1"),
    ),
    before = local.getAttempt(a.id, u.id);
  local.reportIssue(u.id, a.id, "rasio-1", "question", "exam", "Test report");
  local.reportIssue(u.id, a.id, "rasio-1", "question", "exam", "Duplicate");
  expect(sqlite.prepare("SELECT * FROM reports").all()).toHaveLength(1);
  expect(
    JSON.parse(
      String(sqlite.prepare("SELECT context FROM reports").get()!.context),
    ),
  ).toEqual({
    version: 2,
    topic: "rasio",
    kind: "tryout",
    package: "pk-pilot-v1",
    status: "active",
  });
  expect(local.getAttempt(a.id, u.id)).toEqual(before);
  expect(() =>
    local.reportIssue(other, a.id, "rasio-1", "question", "exam", "Invalid"),
  ).toThrow();
  expect(() =>
    local.reportIssue(u.id, a.id, "forged", "question", "exam", "Invalid"),
  ).toThrow();
  expect(() =>
    local.reportIssue(
      u.id,
      a.id,
      "rasio-1",
      "question",
      "solutions",
      "Invalid",
    ),
  ).toThrow();
});
it("read-only SQL verifier detects missing confidence backfill and succeeds after replay", async () => {
  const sql = readFileSync("supabase/verify-pilot.sql", "utf8");
  await pg.query("INSERT INTO public.levelup_mastery VALUES($1,'rasio',$2)", [
    user,
    JSON.stringify({
      topic: "rasio",
      value: 83,
      count: 90,
      advanced: 60,
      confidence: 1,
    }),
  ]);
  const before = (await pg.query<{ check_name: string; passed: boolean }>(sql))
    .rows;
  expect(
    before.find((r) => r.check_name === "confidence_metadata_ready")!.passed,
  ).toBe(false);
  await pg.exec(
    readFileSync(
      "supabase/migrations/202610070001_unique_mastery_evidence.sql",
      "utf8",
    ),
  );
  await pg.exec(
    readFileSync(
      "supabase/migrations/202610070001_unique_mastery_evidence.sql",
      "utf8",
    ),
  );
  const after = (await pg.query<{ check_name: string; passed: boolean }>(sql))
    .rows;
  expect(after.length).toBeGreaterThan(5);
  expect(after.every((r) => r.passed === true)).toBe(true);
  expect(
    (
      await pg.query<{ data: { value: number; count: number } }>(
        "SELECT data FROM public.levelup_mastery WHERE user_id=$1",
        [user],
      )
    ).rows[0].data,
  ).toMatchObject({ value: 83, count: 0 });
});

it("page feedback parity: scoped identity, contextual metadata, replay and privacy", async () => {
  const args = [user, "display", "learn", "rasio", "Page report test"],
    call = () =>
      pg.query("SELECT public.levelup_report_page($1,$2,$3,$4,$5)", args);
  await call();
  await call();
  const rows = (
    await pg.query<{ context: unknown; user_id: string }>(
      "SELECT context,user_id FROM public.levelup_page_reports",
    )
  ).rows;
  expect(rows).toHaveLength(1);
  expect(rows[0].user_id).toBe(user);
  expect(rows[0].context).toEqual({ page: "learn", topic: "rasio" });
  args[0] = other;
  await call();
  expect(
    (await pg.query("SELECT * FROM public.levelup_page_reports")).rows,
  ).toHaveLength(2);
  args[3] = "forged";
  await expect(call()).rejects.toThrow(/invalid report/);
  for (const role of ["anon", "authenticated"]) {
    await pg.exec(`SET ROLE ${role}`);
    try {
      await expect(
        pg.query("SELECT * FROM public.levelup_page_reports"),
      ).rejects.toThrow(/permission denied/);
      await expect(call()).rejects.toThrow(/permission denied/);
    } finally {
      await pg.exec("RESET ROLE");
    }
  }
  const u = local.createUser(
    "page-report@example.com",
    "Fixture",
    "test-only-password",
    "Kelas 12",
    700,
  );
  local.reportPage(u.id, "display", "learn", "rasio", "Page report test");
  local.reportPage(u.id, "display", "learn", "rasio", "Duplicate");
  expect(sqlite.prepare("SELECT * FROM page_reports").all()).toHaveLength(1);
  expect(() =>
    local.reportPage(u.id, "display", "forged", "rasio", "Invalid"),
  ).toThrow();
  expect(() =>
    local.reportPage(u.id, "display", "learn", "forged", "Invalid"),
  ).toThrow();
  await pg.exec(
    readFileSync("supabase/migrations/202610070002_pilot_reports.sql", "utf8"),
  );
  expect(
    (await pg.query("SELECT * FROM public.levelup_page_reports")).rows,
  ).toHaveLength(2);
});

it("result page feedback derives owned attempt context in both stores", async () => {
  const a = (
    await pg.query<{ id: string }>(
      "SELECT id FROM public.levelup_attempts WHERE user_id=$1 LIMIT 1",
      [user],
    )
  ).rows[0];
  await pg.query(
    "SELECT public.levelup_report_page($1,'suggestion','result','','Result fixture',$2)",
    [user, a.id],
  );
  const result = (
    await pg.query<{ context: Record<string, unknown> }>(
      "SELECT context FROM public.levelup_page_reports WHERE view='result'",
    )
  ).rows[0].context;
  expect(result).toMatchObject({
    page: "result",
    attempt_id: a.id,
    kind: "tryout",
    package: "pk-pilot-v1",
  });
  expect(result).not.toHaveProperty("correct");
  await expect(
    pg.query(
      "SELECT public.levelup_report_page($1,'suggestion','result','','Wrong owner',$2)",
      [other, a.id],
    ),
  ).rejects.toThrow(/attempt not found/);
  const u = local.createUser(
      "result-context@example.com",
      "Fixture",
      "test-only-password",
      "Kelas 12",
      700,
    ),
    attempt = local.createAttempt(
      u.id,
      "tryout",
      "pk-pilot-v1",
      tryoutQuestions("pk-pilot-v1"),
    );
  local.reportPage(
    u.id,
    "suggestion",
    "result",
    "",
    "Result fixture",
    attempt.id,
  );
  expect(
    JSON.parse(
      String(
        sqlite
          .prepare("SELECT context FROM page_reports WHERE view='result'")
          .get()!.context,
      ),
    ),
  ).toMatchObject({
    page: "result",
    attempt_id: attempt.id,
    package: "pk-pilot-v1",
  });
  expect(() =>
    local.reportPage(
      other,
      "suggestion",
      "result",
      "",
      "Wrong owner",
      attempt.id,
    ),
  ).toThrow();
});
