import "server-only";
import { createClient } from "@supabase/supabase-js";
import { onlineBackend } from "../../lib/backend";
import { StorageError } from "../../lib/store-errors";
let local:
  | Promise<
      Awaited<
        ReturnType<
          typeof import("../../../scripts/local-content-db.mjs").openLocalContent
        >
      >
    >
  | undefined;
export function testContentAllowed() {
  return !onlineBackend() && process.env.LEVELUP_TEST_MODE === "1";
}
export async function contentRPC<T>(
  name: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  try {
    if (onlineBackend()) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
        key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key)
        throw new StorageError("Database konten belum dikonfigurasi.");
      const { data, error } = await createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      }).rpc(name, args);
      if (error) throw error;
      return data as T;
    }
    local ??= import("../../../scripts/local-content-db.mjs").then((m) =>
      m.openLocalContent(),
    );
    const db = await local;
    if (typeof args.p_actor === "string")
      await db.query(
        "INSERT INTO auth.users(id) VALUES($1) ON CONFLICT DO NOTHING",
        [args.p_actor],
      );
    const ordered: Record<string, string[]> = {
      levelup_admin_content: ["p_actor", "p_action", "p"],
      levelup_content_catalog: [],
      levelup_published_questions: ["p_test_only"],
    };
    const keys = ordered[name];
    if (!keys) throw new Error("Unknown RPC");
    const values = keys.map((k) =>
      typeof args[k] === "object" && args[k] !== null
        ? JSON.stringify(args[k])
        : args[k],
    );
    const result = await db.query<{ data: T }>(
      `SELECT public.${name}(${keys.map((_, i) => "$" + (i + 1)).join(",")}) data`,
      values,
    );
    return result.rows[0].data;
  } catch (error) {
    if (error instanceof StorageError) throw error;
    const e = error as { message?: string; code?: string };
    if (e.message?.includes("forbidden"))
      throw new StorageError("Akses admin ditolak.", 403);
    if (e.code === "23505" || e.code === "40001")
      throw new StorageError(
        "Kode duplikat atau konten berubah. Muat ulang dan coba lagi.",
        409,
      );
    if (e.code === "23503")
      throw new StorageError("Relasi taxonomy/media tidak valid.", 400);
    if (e.code === "P0001" || e.code === "23514" || e.code === "22P02")
      throw new StorageError(e.message || "Konten tidak valid.", 400);
    throw new StorageError(
      "Penyimpanan konten belum tersedia. Periksa migration dan konfigurasi.",
    );
  }
}
export function adminContent<T>(
  userId: string,
  action: string,
  payload: Record<string, unknown> = {},
) {
  return contentRPC<T>("levelup_admin_content", {
    p_actor: userId,
    p_action: action,
    p: payload,
  });
}
