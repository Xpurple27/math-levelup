import { PGlite } from "@electric-sql/pglite";
import { mkdirSync, readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
export async function openLocalContent(
  dir = process.env.LEVELUP_DATA_DIR || ".data",
) {
  const root = resolve(dir, "content-pg");
  mkdirSync(root, { recursive: true });
  const db = new PGlite(root);
  await db.exec(
    "DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;END IF;END $$;CREATE SCHEMA IF NOT EXISTS auth;CREATE TABLE IF NOT EXISTS auth.users(id uuid PRIMARY KEY);CREATE TABLE IF NOT EXISTS public.levelup_content_migrations(name text PRIMARY KEY);",
  );
  for (const name of readdirSync("supabase/migrations")
    .filter((n) => n.endsWith(".sql"))
    .sort()) {
    if (
      (
        await db.query(
          "SELECT name FROM public.levelup_content_migrations WHERE name=$1",
          [name],
        )
      ).rows.length
    )
      continue;
    await db.exec(readFileSync(join("supabase/migrations", name), "utf8"));
    await db.query("INSERT INTO public.levelup_content_migrations VALUES($1)", [
      name,
    ]);
  }
  return db;
}
