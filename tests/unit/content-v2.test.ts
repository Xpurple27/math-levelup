import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  type QuestionDetail,
  type Catalog,
  blankDraft,
  qaFields,
} from "../../src/features/content/model";
let db: PGlite;
const admin = "00000000-0000-4000-8000-000000000011",
  reviewer = "00000000-0000-4000-8000-000000000012",
  student = "00000000-0000-4000-8000-000000000013";
async function rpc(actor: string, action: string, p: unknown = {}) {
  return (
    await db.query<{
      data: QuestionDetail &
        Catalog & {
          current_version_id: string;
          rows: { status: string; question_id: string }[];
        };
    }>("select public.levelup_admin_content($1,$2,$3::jsonb) data", [
      actor,
      action,
      JSON.stringify(p),
    ])
  ).rows[0].data;
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    "CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);",
  );
  for (const f of readdirSync("supabase/migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await db.exec(readFileSync("supabase/migrations/" + f, "utf8"));
  for (const [id, role] of [
    [admin, "ADMIN"],
    [reviewer, "REVIEWER"],
    [student, "STUDENT"],
  ]) {
    await db.query("insert into auth.users values($1)", [id]);
    await db.query("insert into public.levelup_roles values($1,$2)", [
      id,
      role,
    ]);
  }
}, 30000);
afterAll(async () => {
  await db.close();
});
function draft(code: string) {
  const p = blankDraft();
  p.code = code;
  p.section_id = "11000000-0000-4000-8000-000000000001";
  p.subtopic_id = "14000000-0000-4000-8000-000000000001";
  p.stem_md = "TEST_ONLY $x+1=3$";
  p.options = p.options
    .slice(0, 4)
    .map((o, i) => ({ ...o, content_md: String(i + 1), is_correct: i === 1 }));
  for (const k of [
    "understanding_md",
    "concept_md",
    "first_step_md",
    "solution_md",
    "final_answer_md",
  ])
    p.explanation[k] = "TEST_ONLY $x=2$";
  return p;
}
describe("normalized content lifecycle and database boundary", () => {
  it("starts with zero production questions and enforces server roles", async () => {
    expect((await rpc(admin, "catalog")).published_count).toBe(0);
    await expect(rpc(student, "list")).rejects.toThrow("forbidden");
    await expect(rpc(reviewer, "create", draft("TEST-ROLE"))).rejects.toThrow(
      "forbidden",
    );
    await db.exec("SET ROLE authenticated");
    await expect(
      db.query("select * from public.question_options"),
    ).rejects.toThrow("permission denied");
    await expect(
      db.query("select public.levelup_content_catalog()"),
    ).rejects.toThrow("permission denied");
    await db.exec("RESET ROLE");
  });
  it("requires independent QA, preserves published version during revision, and forbids mutation", async () => {
    const q = await rpc(admin, "create", draft("TEST-LIFECYCLE"));
    const vid = q.versions[0].id;
    await expect(rpc(admin, "publish", { version_id: vid })).rejects.toThrow(
      "QA approval",
    );
    await rpc(admin, "send_qa", { version_id: vid });
    await expect(
      rpc(admin, "review", {
        version_id: vid,
        outcome: "APPROVED",
        notes: "self",
        checks: Object.fromEntries(qaFields.map((k) => [k, true])),
      }),
    ).rejects.toThrow("independent reviewer");
    await expect(
      rpc(reviewer, "review", {
        version_id: vid,
        outcome: "APPROVED",
        notes: "missing checks",
      }),
    ).rejects.toThrow("checklist");
    await rpc(reviewer, "review", {
      version_id: vid,
      outcome: "APPROVED",
      notes: "TEST_ONLY verified",
      checks: Object.fromEntries(qaFields.map((k) => [k, true])),
    });
    expect((await rpc(admin, "catalog")).published_count).toBe(0);
    await rpc(admin, "publish", { version_id: vid });
    await expect(
      db.query(
        "update public.question_versions set stem_md='changed' where id=$1",
        [vid],
      ),
    ).rejects.toThrow();
    await expect(
      db.query(
        "update public.question_options set content_md='changed' where question_version_id=$1",
        [vid],
      ),
    ).rejects.toThrow();
    await expect(
      db.query("delete from public.questions where id=$1", [q.id]),
    ).rejects.toThrow();
    const revision = await rpc(admin, "revision", { id: q.id });
    expect(revision.versions[0].version_number).toBe(2);
    expect(revision.current_version_id).toBe(vid);
    expect(revision.versions[0].status).toBe("DRAFT");
    await rpc(admin, "archive", { id: q.id });
    const runtime = await db.query<{ data: unknown[] }>(
      "select public.levelup_published_questions(false) data",
    );
    expect(runtime.rows[0].data).toEqual([]);
  });
  it("rejects two keys, broken taxonomy, missing explanations and stale saves", async () => {
    const p = draft("TEST-TWO-KEYS");
    p.options[0].is_correct = true;
    await expect(rpc(admin, "create", p)).rejects.toThrow();
    await expect(
      rpc(admin, "create", {
        ...draft("TEST-FK"),
        subtopic_id: "99999999-0000-4000-8000-000000000001",
      }),
    ).rejects.toThrow();
    const q = await rpc(admin, "create", {
      ...draft("TEST-INCOMPLETE"),
      explanation: {},
    });
    await expect(
      rpc(admin, "send_qa", { version_id: q.versions[0].id }),
    ).rejects.toThrow();
    await expect(
      rpc(admin, "save", {
        ...draft("TEST-INCOMPLETE"),
        version_id: q.versions[0].id,
        expected_updated_at: "2000-01-01T00:00:00Z",
      }),
    ).rejects.toThrow("concurrent");
    await expect(
      db.query(
        "insert into public.question_versions(question_id,version_number,section_id,subtopic_id,difficulty,created_by) values($1,1,$2,$3,$4,$5)",
        [q.id, p.section_id, p.subtopic_id, p.difficulty, admin],
      ),
    ).rejects.toThrow("unique");
    await rpc(admin, "delete_draft", { version_id: q.versions[0].id });
    expect(
      (await db.query("select id from public.questions where id=$1", [q.id]))
        .rows,
    ).toHaveLength(0);
  });
  it("persists import preview, confirms drafts only, and is idempotent", async () => {
    const p = draft("TEST-IMPORT");
    const job = await rpc(admin, "import_preview", {
      file_name: "test.xlsx",
      summary: { valid: 1, invalid: 0, skipped: 0 },
      rows: [
        {
          row_number: 2,
          raw: { question_code: p.code },
          parsed: p,
          status: "VALID",
        },
      ],
    });
    expect(job.status).toBe("READY_FOR_REVIEW");
    await rpc(admin, "import_confirm", { id: job.id });
    await rpc(admin, "import_confirm", { id: job.id });
    const detail = await rpc(admin, "import_detail", { id: job.id });
    expect(detail.rows[0].status).toBe("IMPORTED");
    expect(
      (await rpc(admin, "detail", { id: detail.rows[0].question_id }))
        .versions[0].status,
    ).toBe("DRAFT");
    const bad = await rpc(admin, "import_preview", {
      file_name: "bad.xlsx",
      summary: { valid: 0, invalid: 1, skipped: 0 },
      rows: [
        {
          row_number: 2,
          raw: {},
          parsed: null,
          status: "INVALID",
          error_message: "missing",
        },
      ],
    });
    await expect(rpc(admin, "import_confirm", { id: bad.id })).rejects.toThrow(
      "invalid rows",
    );
  });
  it("replays V2 migrations and resets only retired snapshots without deleting identities", async () => {
    const oldId = "00000000-0000-4000-8000-000000000091",
      newId = "00000000-0000-4000-8000-000000000092";
    await db.query(
      "insert into public.levelup_attempts(id,user_id,kind,topic,started,snapshot,status) values($1,$2,'practice','rasio',1,$3,'completed'),($4,$2,'practice','current',2,$5,'completed')",
      [
        oldId,
        student,
        JSON.stringify([{ id: "rasio-1" }]),
        newId,
        JSON.stringify([{ id: "00000000-0000-4000-8000-000000000093" }]),
      ],
    );
    await db.query(
      "insert into public.levelup_mastery(user_id,topic,data) values($1,'rasio','{}'),($1,'current','{}')",
      [student],
    );
    for (const file of [
      "202610090001_content_v2.sql",
      "202610090002_content_operations.sql",
      "202610090003_reset_generated_content.sql",
    ])
      await db.exec(readFileSync("supabase/migrations/" + file, "utf8"));
    expect(
      (
        await db.query("select id from public.levelup_attempts where id=$1", [
          oldId,
        ])
      ).rows,
    ).toHaveLength(0);
    expect(
      (
        await db.query("select id from public.levelup_attempts where id=$1", [
          newId,
        ])
      ).rows,
    ).toHaveLength(1);
    expect((await db.query("select id from auth.users")).rows).toHaveLength(3);
    expect(
      (
        await db.query(
          "select topic from public.levelup_mastery where user_id=$1",
          [student],
        )
      ).rows,
    ).toEqual([{ topic: "current" }]);
  });
  it("rolls back an entire confirmed import when a code conflicts after preview", async () => {
    const rows = [draft("TEST-ATOMIC-NEW"), draft("TEST-ATOMIC-CONFLICT")].map(
      (parsed, i) => ({
        row_number: i + 2,
        raw: { code: parsed.code },
        parsed,
        status: "VALID",
      }),
    );
    const job = await rpc(admin, "import_preview", {
      file_name: "atomic.xlsx",
      summary: { valid: 2, invalid: 0, skipped: 0 },
      rows,
    });
    await rpc(admin, "create", draft("TEST-ATOMIC-CONFLICT"));
    await expect(rpc(admin, "import_confirm", { id: job.id })).rejects.toThrow(
      "unique",
    );
    expect(
      (
        await db.query(
          "select code from public.questions where code='TEST-ATOMIC-NEW'",
        )
      ).rows,
    ).toHaveLength(0);
    expect((await rpc(admin, "import_detail", { id: job.id })).status).toBe(
      "READY_FOR_REVIEW",
    );
  });
});
