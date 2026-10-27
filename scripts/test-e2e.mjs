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
const fixtureVersions = {};
for (let s = 1; s <= 3; s++)
  for (let i = 0; i < 18; i++) {
    const section_id = `11000000-0000-4000-8000-00000000000${s}`,
      subtopic_id = `14000000-0000-4000-8000-00000000000${s}`;
    const q = await rpc(admin, "create", {
      code: `TEST-ONLY-${s}-${i}`,
      section_id,
      subtopic_id,
      difficulty: i < 4 ? "BASIC" : i < 12 ? "MEDIUM" : "HARD",
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
    (fixtureVersions[s] ||= []).push(vid);
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
// Deliberately synthetic content to exercise the journey, never a production seed.
const subtopic = "14000000-0000-4000-8000-000000000001";
const domain = (
  await db.query(
    "SELECT t.domain_id FROM public.subtopics st JOIN public.topics t ON t.id=st.topic_id WHERE st.id=$1",
    [subtopic],
  )
).rows[0].domain_id;
const learningModuleId = (
  await db.query(
    `INSERT INTO public.learning_modules(subtopic_id,code,slug,title,description,level,status,estimated_minutes)
 VALUES($1,'TEST-LOOP','test-loop','TEST_ONLY Konsep dasar','TEST_ONLY synthetic lesson','FOUNDATION','PUBLISHED',2) RETURNING id`,
    [subtopic],
  )
).rows[0].id;
const lesson = (
  await db.query(
    `INSERT INTO public.learning_lessons(module_id,title,slug,status,estimated_minutes)
 VALUES($1,'TEST_ONLY Pelajari persamaan','test-lesson','PUBLISHED',2) RETURNING id`,
    [learningModuleId],
  )
).rows[0].id;
await db.query(
  `INSERT INTO public.lesson_blocks(lesson_id,block_type,sort_order,content_json) VALUES
 ($1,'TEXT',0,'{"text":"TEST_ONLY: persamaan $x+1=3$ diselesaikan dengan mengurangi kedua ruas dengan 1, sehingga $x=2$."}'),
 ($1,'SUMMARY',1,'{"text":"TEST_ONLY: lakukan operasi yang sama pada kedua ruas."}')`,
  [lesson],
);
const practice = (
  await db.query(
    `INSERT INTO public.practice_packages(section_id,subtopic_id,domain_id,code,slug,title,description,status,estimated_minutes)
 VALUES('11000000-0000-4000-8000-000000000001',$1,$2,'TEST-PRACTICE','test-practice','TEST_ONLY Latihan terarah','TEST_ONLY fixture, bukan konten UTBK','PUBLISHED',3) RETURNING id`,
    [subtopic, domain],
  )
).rows[0].id;
for (const [order, version] of fixtureVersions[1].slice(0, 5).entries()) {
  await db.query(
    "INSERT INTO public.practice_package_questions(practice_package_id,question_version_id,sort_order) VALUES($1,$2,$3)",
    [practice, version, order],
  );
}
// Published metadata alone must not make empty lessons recommendable.
const empty = (
  await db.query(`INSERT INTO public.learning_modules(subtopic_id,code,slug,title,level,status,estimated_minutes)
 VALUES('14000000-0000-4000-8000-000000000002','TEST-EMPTY','test-empty','TEST_ONLY EMPTY','FOUNDATION','PUBLISHED',2) RETURNING id`)
).rows[0].id;
await db.query(
  "INSERT INTO public.learning_lessons(module_id,title,slug,status,estimated_minutes) VALUES($1,'TEST_ONLY EMPTY','empty','PUBLISHED',2)",
  [empty],
);
// Catalog data owns the timer; request-supplied durations must have no effect.
for (let section = 1; section <= 3; section++) {
  const pack = (
    await db.query(
      `INSERT INTO public.tryout_packages(section_id,code,slug,suite_code,suite_title,title,status,question_count,duration_seconds,section_order)
 VALUES($1,$2,$3,'TEST-SUITE','TEST_ONLY suite',$2,'PUBLISHED',5,$4,$5) RETURNING id`,
      [
        `11000000-0000-4000-8000-00000000000${section}`,
        `TEST-TRYOUT-${section}`,
        `test-tryout-${section}`,
        section * 90,
        section,
      ],
    )
  ).rows[0].id;
  for (const [order, version] of fixtureVersions[section].slice(0, 5).entries())
    await db.query(
      "INSERT INTO public.tryout_package_questions(tryout_package_id,question_version_id,sort_order) VALUES($1,$2,$3)",
      [pack, version, order],
    );
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
