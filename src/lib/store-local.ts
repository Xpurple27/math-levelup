import {
  reportCategories,
  reportPages,
  validReportTopic,
} from "./feedback-rules";
import "server-only";
import {
  attemptDurationMs,
  activityQualifies,
  learningDay,
  streakForDays,
} from "./learning-rules";
import { StorageError } from "./store-errors";
import { rebuildUniqueEvidence } from "./scoring";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import type { Question } from "./content";
import type { Mastery } from "./scoring";
// Runtime data is external to the application bundle and must never be traced into it.
const dir = resolve(
  /*turbopackIgnore: true*/ process.env.LEVELUP_DATA_DIR || ".data",
);
mkdirSync(dir, { recursive: true });
const db = new DatabaseSync(resolve(dir, "levelup.sqlite"));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,password TEXT NOT NULL,goal INTEGER NOT NULL DEFAULT 700,grade TEXT NOT NULL DEFAULT 'Kelas 12');
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS attempts(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),kind TEXT NOT NULL,topic TEXT,started INTEGER NOT NULL,deadline INTEGER,snapshot TEXT NOT NULL,answers TEXT NOT NULL DEFAULT '{}',feedback TEXT NOT NULL DEFAULT '{}',credits TEXT NOT NULL DEFAULT '{}',status TEXT NOT NULL DEFAULT 'active',result TEXT);
CREATE TABLE IF NOT EXISTS mastery(user_id TEXT NOT NULL REFERENCES users(id),topic TEXT NOT NULL,data TEXT NOT NULL,PRIMARY KEY(user_id,topic));
CREATE TABLE IF NOT EXISTS activities(user_id TEXT NOT NULL REFERENCES users(id),day TEXT NOT NULL,kind TEXT NOT NULL,PRIMARY KEY(user_id,day,kind));`);
// Local schema upgrades are additive and preserve historical snapshots.
if (
  !db
    .prepare("PRAGMA table_info(attempts)")
    .all()
    .some((r) => r.name === "revision")
) {
  db.exec(
    "ALTER TABLE attempts ADD COLUMN revision INTEGER NOT NULL DEFAULT 0",
  );
}
export type { User, Attempt } from "./store-types";
import type { User, Attempt } from "./store-types";
export function passwordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function passwordMatches(password: string, stored: string) {
  const [salt, key] = stored.split(":");
  const hash = scryptSync(password, salt, 64);
  return timingSafeEqual(hash, Buffer.from(key, "hex"));
}
export function createUser(
  email: string,
  name: string,
  password: string,
  grade: string,
  goal: number,
): User {
  const id = randomUUID();
  db.prepare(
    "INSERT INTO users(id,email,name,password,grade,goal) VALUES(?,?,?,?,?,?)",
  ).run(id, email, name, passwordHash(password), grade, goal);
  return { id, email, name, grade, goal };
}
export function authenticate(email: string, password: string): User | null {
  const row = db.prepare("SELECT * FROM users WHERE email=?").get(email) as
    (User & { password: string }) | undefined;
  if (!row || !passwordMatches(password, row.password)) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    grade: row.grade,
    goal: row.goal,
  };
}
export function newSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sessions VALUES(?,?,?)").run(
    token,
    userId,
    Date.now() + 7 * 86400000,
  );
  return token;
}
export function getUser(token: string | undefined): User | null {
  if (!token) return null;
  return (
    (db
      .prepare(
        "SELECT u.id,u.email,u.name,u.grade,u.goal FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=? AND s.expires>?",
      )
      .get(token, Date.now()) as User | undefined) ?? null
  );
}
export function logout(token: string) {
  db.prepare("DELETE FROM sessions WHERE token=?").run(token);
}
function decode(row: Record<string, unknown> | undefined): Attempt | null {
  if (!row) return null;
  return {
    ...row,
    snapshot: JSON.parse(row.snapshot as string),
    answers: JSON.parse(row.answers as string),
    feedback: JSON.parse(row.feedback as string),
    credits: JSON.parse(row.credits as string),
    result: row.result ? JSON.parse(row.result as string) : null,
  } as Attempt;
}
export function getAttempt(id: string, userId: string) {
  return decode(
    db
      .prepare("SELECT * FROM attempts WHERE id=? AND user_id=?")
      .get(id, userId) as Record<string, unknown> | undefined,
  );
}
export function activeAttempt(
  userId: string,
  kind: string,
  topic: string | null,
) {
  return decode(
    db
      .prepare(
        "SELECT * FROM attempts WHERE user_id=? AND kind=? AND topic IS ? AND status='active' ORDER BY started DESC LIMIT 1",
      )
      .get(userId, kind, topic) as Record<string, unknown> | undefined,
  );
}
export function createAttempt(
  userId: string,
  kind: string,
  topic: string | null,
  questions: Question[],
) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const existing = activeAttempt(userId, kind, topic);
    if (existing) {
      db.exec("COMMIT");
      return existing;
    }
    const id = randomUUID(),
      now = Date.now(),
      duration = attemptDurationMs(kind, topic);
    db.prepare(
      "INSERT INTO attempts(id,user_id,kind,topic,started,deadline,snapshot) VALUES(?,?,?,?,?,?,?)",
    ).run(
      id,
      userId,
      kind,
      topic,
      now,
      duration === null ? null : now + duration,
      JSON.stringify(questions),
    );
    const attempt = getAttempt(id, userId)!;
    db.exec("COMMIT");
    return attempt;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
export function saveAttempt(a: Attempt) {
  const change = db
    .prepare(
      "UPDATE attempts SET answers=?,feedback=?,credits=?,revision=revision+1 WHERE id=? AND user_id=? AND status='active' AND revision=? AND (deadline IS NULL OR deadline>?)",
    )
    .run(
      JSON.stringify(a.answers),
      JSON.stringify(a.feedback),
      JSON.stringify(a.credits),
      a.id,
      a.user_id,
      a.revision,
      Date.now(),
    );
  if (!change.changes)
    throw new StorageError(
      "Jawaban belum tersimpan karena sesi berubah atau waktu habis. Muat ulang sesi.",
      409,
    );
  a.revision++;
}

export function getMastery(userId: string): Mastery[] {
  return db
    .prepare("SELECT data FROM mastery WHERE user_id=? ORDER BY topic")
    .all(userId)
    .map((r) => JSON.parse(r.data as string));
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
export function finalize(
  a: Attempt,
  result: Attempt["result"],
  masteries: Mastery[],
  old: Mastery[],
) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const current = getAttempt(a.id, a.user_id);
    if (!current) throw new StorageError("Sesi tidak ditemukan.", 404);
    if (current.status === "completed") {
      db.exec("COMMIT");
      return false;
    }
    const prior = getMastery(a.user_id);
    const keyed = (values: Mastery[]) =>
      Object.fromEntries(values.map((m) => [m.topic, m]));
    if (
      current.revision !== a.revision ||
      canonical(keyed(prior)) !== canonical(keyed(old))
    )
      throw new StorageError(
        "Ada perubahan dari sesi lain. Muat ulang sebelum melanjutkan.",
        409,
      );
    db.prepare(
      "UPDATE attempts SET status='completed',result=?,revision=revision+1 WHERE id=? AND user_id=? AND status='active'",
    ).run(JSON.stringify(result), a.id, a.user_id);
    for (const m of masteries)
      db.prepare(
        "INSERT INTO mastery VALUES(?,?,?) ON CONFLICT(user_id,topic) DO UPDATE SET data=excluded.data",
      ).run(a.user_id, m.topic, JSON.stringify(m));
    if (activityQualifies(current.kind, current.answers))
      db.prepare("INSERT OR IGNORE INTO activities VALUES(?,?,?)").run(
        a.user_id,
        learningDay(),
        current.kind,
      );
    db.exec("COMMIT");
    return true;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
export function progress(userId: string) {
  const history = db
    .prepare(
      "SELECT id,kind,topic,started,result FROM attempts WHERE user_id=? AND status='completed' ORDER BY started DESC LIMIT 30",
    )
    .all(userId)
    .map((r) => ({ ...r, result: JSON.parse(r.result as string) }));
  const days = db
    .prepare(
      "SELECT DISTINCT day FROM activities WHERE user_id=? ORDER BY day DESC",
    )
    .all(userId)
    .map((r) => r.day as string);
  return {
    mastery: getMastery(userId),
    history,
    days,
    streak: streakForDays(days),
  };
}

/** Only question IDs from the owner's recent sessions; never sent to the browser. */
export function seenQuestionIds(userId: string): string[] {
  const rows = db
    .prepare(
      "SELECT snapshot FROM attempts WHERE user_id=? ORDER BY started DESC LIMIT 30",
    )
    .all(userId);
  return [
    ...new Set(
      rows.flatMap((r) =>
        (JSON.parse(r.snapshot as string) as Question[]).map((q) => q.id),
      ),
    ),
  ];
}

// Evidence lives in the existing mastery JSON; no extra domain tables are needed.
db.exec("BEGIN IMMEDIATE");
try {
  const rows = db.prepare("SELECT user_id,topic,data FROM mastery").all();
  for (const row of rows) {
    const old = JSON.parse(row.data as string) as Mastery;
    if (old.uniqueEvidence) continue;
    const attempts = db
      .prepare(
        "SELECT snapshot,answers FROM attempts WHERE user_id=? AND status='completed'",
      )
      .all(row.user_id as string)
      .map((a) => ({
        snapshot: JSON.parse(a.snapshot as string) as Question[],
        answers: JSON.parse(a.answers as string) as Record<string, number>,
      }));
    const rebuilt = rebuildUniqueEvidence(old, attempts);
    db.prepare("UPDATE mastery SET data=? WHERE user_id=? AND topic=?").run(
      JSON.stringify(rebuilt),
      row.user_id as string,
      row.topic as string,
    );
  }
  db.exec("COMMIT");
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
}

db.exec(
  `CREATE TABLE IF NOT EXISTS reports(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),attempt_id TEXT NOT NULL REFERENCES attempts(id),question_id TEXT NOT NULL,category TEXT NOT NULL,view TEXT NOT NULL,message TEXT NOT NULL,context TEXT NOT NULL,created INTEGER NOT NULL,UNIQUE(user_id,attempt_id,question_id,category,view))`,
);
export function reportIssue(
  userId: string,
  attemptId: string,
  questionId: string,
  category: string,
  view: string,
  message: string,
) {
  const a = getAttempt(attemptId, userId),
    q = a?.snapshot.find((q) => q.id === questionId);
  if (
    !a ||
    !q ||
    !reportCategories.includes(category) ||
    !["exam", "solutions"].includes(view) ||
    (view === "solutions" && a.status !== "completed") ||
    !message.trim() ||
    message.trim().length > 1000
  )
    throw new StorageError("Konteks laporan tidak valid.", 400);
  db.prepare(
    "INSERT INTO reports VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id,attempt_id,question_id,category,view) DO NOTHING",
  ).run(
    randomUUID(),
    userId,
    attemptId,
    questionId,
    category,
    view,
    message.trim(),
    JSON.stringify({
      version: q.version,
      topic: q.topic,
      kind: a.kind,
      package: a.kind === "tryout" ? a.topic : null,
      status: a.status,
    }),
    Date.now(),
  );
}

db.exec(
  `CREATE TABLE IF NOT EXISTS page_reports(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),category TEXT NOT NULL,message TEXT NOT NULL,view TEXT NOT NULL,topic TEXT NOT NULL,context TEXT NOT NULL,created INTEGER NOT NULL,UNIQUE(user_id,category,view,topic))`,
);
// Additive upgrade for local development databases from the initial RC iteration.
const pageReportColumns = db.prepare("PRAGMA table_info(page_reports)").all();
if (!pageReportColumns.some((c) => c.name === "attempt_id"))
  db.exec(
    "ALTER TABLE page_reports ADD COLUMN attempt_id TEXT REFERENCES attempts(id)",
  );
if (!pageReportColumns.some((c) => c.name === "question_id"))
  db.exec("ALTER TABLE page_reports ADD COLUMN question_id TEXT");
export function reportPage(
  userId: string,
  category: string,
  view: string,
  topic: string,
  message: string,
  attemptId?: string,
) {
  const a = attemptId ? getAttempt(attemptId, userId) : null;
  if (attemptId && !a) throw new StorageError("Sesi tidak ditemukan.", 404);
  if (
    !reportCategories.includes(category) ||
    !reportPages.includes(view) ||
    !validReportTopic(topic) ||
    !message.trim() ||
    message.trim().length > 1000
  )
    throw new StorageError("Konteks laporan tidak valid.", 400);
  db.prepare(
    "INSERT INTO page_reports(id,user_id,category,message,view,topic,context,created,attempt_id,question_id) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id,category,view,topic) DO NOTHING",
  ).run(
    randomUUID(),
    userId,
    category,
    message.trim(),
    view,
    topic,
    JSON.stringify({
      page: view,
      topic: topic || null,
      ...(a
        ? {
            attempt_id: a.id,
            kind: a.kind,
            package: a.kind === "tryout" ? a.topic : null,
            status: a.status,
          }
        : {}),
    }),
    Date.now(),
    attemptId ?? null,
    null,
  );
}

// C1 reset: remove only obsolete generated-content test history; preserve accounts/sessions.
db.exec("CREATE TABLE IF NOT EXISTS local_migrations(name TEXT PRIMARY KEY)");
if (
  !db
    .prepare("SELECT name FROM local_migrations WHERE name=?")
    .get("content-v2-reset")
) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const retired = (
      db.prepare("SELECT id,user_id,snapshot FROM attempts").all() as {
        id: string;
        user_id: string;
        snapshot: string;
      }[]
    ).filter((a) => {
      try {
        return (JSON.parse(a.snapshot) as Question[]).some(
          (q) =>
            /^(rasio|aljabar|statistika)-[0-9]+$/.test(q.id) ||
            /^(persen|geometri|peluang|pola)-f[0-9]+-v[0-9]+$/.test(q.id),
        );
      } catch {
        return false;
      }
    });
    const owners = new Set(retired.map((a) => a.user_id));
    for (const a of retired) {
      db.prepare("DELETE FROM reports WHERE attempt_id=?").run(a.id);
      db.prepare("DELETE FROM page_reports WHERE attempt_id=?").run(a.id);
      db.prepare("DELETE FROM attempts WHERE id=?").run(a.id);
    }
    for (const owner of owners) {
      db.prepare(
        "DELETE FROM mastery WHERE user_id=? AND topic IN ('rasio','aljabar','statistika','persen','geometri','peluang','pola')",
      ).run(owner);
      if (
        !db
          .prepare("SELECT id FROM attempts WHERE user_id=? LIMIT 1")
          .get(owner)
      )
        db.prepare("DELETE FROM activities WHERE user_id=?").run(owner);
    }
    db.prepare("INSERT INTO local_migrations VALUES(?)").run(
      "content-v2-reset",
    );
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
