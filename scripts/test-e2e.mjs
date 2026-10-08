// Isolated TEST_ONLY fixtures; never runs against hosted Supabase.
import { mkdtempSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { randomBytes, scryptSync } from "node:crypto";
import { spawn } from "node:child_process";
import { openLocalContent } from "./local-content-db.mjs";
if (process.env.VERCEL)
  throw new Error("Local E2E fixtures cannot run on Vercel");
const dir = mkdtempSync(join(tmpdir(), "levelup-e2e-"));
mkdirSync(dir, { recursive: true });
const sqlite = new DatabaseSync(join(dir, "levelup.sqlite"));
sqlite.exec(
  "CREATE TABLE users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,password TEXT NOT NULL,goal INTEGER NOT NULL DEFAULT 700,grade TEXT NOT NULL DEFAULT 'Kelas 12')",
);
const db = await openLocalContent(dir);
const admin = "00000000-0000-4000-8000-000000000021",
  reviewer = "00000000-0000-4000-8000-000000000022";
for (const [id, role] of [
  [admin, "ADMIN"],
  [reviewer, "REVIEWER"],
]) {
  const salt = randomBytes(16).toString("hex"),
    hash = scryptSync("Test-only-2026", salt, 64).toString("hex");
  sqlite
    .prepare("INSERT INTO users(id,email,name,password) VALUES(?,?,?,?)")
    .run(id, role.toLowerCase() + "@example.com", role, salt + ":" + hash);
  await db.query("insert into auth.users values($1)", [id]);
  await db.query("insert into public.levelup_roles values($1,$2)", [id, role]);
}
async function rpc(actor, action, p) {
  return (
    await db.query(
      "select public.levelup_admin_content($1,$2,$3::jsonb) data",
      [actor, action, JSON.stringify(p)],
    )
  ).rows[0].data;
}
for (let s = 1; s <= 3; s++)
  for (let i = 0; i < 8; i++) {
    const section_id = `11000000-0000-4000-8000-00000000000${s}`,
      subtopic_id = `14000000-0000-4000-8000-00000000000${s}`;
    const q = await rpc(admin, "create", {
      code: `TEST-ONLY-${s}-${i}`,
      section_id,
      subtopic_id,
      difficulty: i < 2 ? "BASIC" : i < 5 ? "MEDIUM" : "HARD",
      stem_md: "TEST_ONLY: solve $x+1=3$.",
      source_type: "ORIGINAL",
      options: ["1", "2", "3", "4"].map((content_md, k) => ({
        option_key: String.fromCharCode(65 + k),
        content_md,
        is_correct: k === 1,
      })),
      explanation: Object.fromEntries(
        [
          "understanding_md",
          "concept_md",
          "first_step_md",
          "solution_md",
          "final_answer_md",
        ].map((k) => [k, "TEST_ONLY $x=2$"]),
      ),
      media_ids: [],
    });
    await db.query(
      "update public.questions set status='TEST_ONLY' where id=$1",
      [q.id],
    );
    const vid = q.versions[0].id;
    await rpc(admin, "send_qa", { version_id: vid });
    await rpc(reviewer, "review", {
      version_id: vid,
      outcome: "APPROVED",
      notes: "TEST_ONLY fixture checked",
      checks: {
        math: true,
        key: true,
        wording: true,
        difficulty: true,
        taxonomy: true,
        explanation: true,
        distractors: true,
      },
    });
    await rpc(admin, "publish", { version_id: vid });
  }
await db.close();
sqlite.close();
const child = spawn(
  process.execPath,
  ["node_modules/@playwright/test/cli.js", "test", ...process.argv.slice(2)],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      LEVELUP_BACKEND: "local",
      LEVELUP_TEST_MODE: "1",
      LEVELUP_DATA_DIR: dir,
    },
  },
);
child.on("exit", (code) => (process.exitCode = code ?? 1));
