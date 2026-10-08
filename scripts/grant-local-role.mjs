import { DatabaseSync } from "node:sqlite";
import { resolve } from "node:path";
import { openLocalContent } from "./local-content-db.mjs";
if (process.env.VERCEL || process.env.LEVELUP_BACKEND === "supabase")
  throw new Error(
    "This command supports local development only. Use operator SQL for hosted roles.",
  );
const [email, role] = process.argv.slice(2);
if (!email || !["STUDENT", "ADMIN", "REVIEWER"].includes(role))
  throw new Error(
    "Usage: npm run admin:grant -- existing-email ADMIN|REVIEWER|STUDENT. Stop the dev server first.",
  );
const dir = process.env.LEVELUP_DATA_DIR || ".data",
  sqlite = new DatabaseSync(resolve(dir, "levelup.sqlite"));
const user = sqlite
  .prepare("select id from users where email=?")
  .get(email.toLowerCase());
if (!user) throw new Error("Register the account first.");
const db = await openLocalContent(dir);
await db.query("insert into auth.users(id) values($1) on conflict do nothing", [
  user.id,
]);
await db.query(
  "insert into public.levelup_roles(user_id,role) values($1,$2) on conflict(user_id) do update set role=excluded.role",
  [user.id, role],
);
await db.close();
sqlite.close();
console.log("Local role updated.");
