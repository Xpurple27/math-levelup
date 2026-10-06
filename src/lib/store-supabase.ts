import "server-only";
import { createClient, type User as AuthUser } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "./supabase/server";
import type { User, Attempt } from "./store-local";
import type { Question } from "./content";
import type { Mastery } from "./scoring";
export class StorageError extends Error {
  constructor(
    message: string,
    public status = 503,
  ) {
    super(message);
  }
}
function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new StorageError(
      "Penyimpanan belajar belum siap. Hubungi pengelola aplikasi.",
    );
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
function checked<T>(
  data: T,
  error: { code?: string; message: string } | null,
): T {
  if (error) {
    if (error.code === "40001")
      throw new StorageError(
        "Ada perubahan dari sesi lain. Muat ulang sebelum melanjutkan.",
        409,
      );
    throw new StorageError(
      "Penyimpanan belajar belum tersedia. Silakan coba lagi atau hubungi pengelola.",
    );
  }
  return data;
}
function profile(u: AuthUser): User {
  return {
    id: u.id,
    email: u.email || "",
    name:
      typeof u.user_metadata.display_name === "string"
        ? u.user_metadata.display_name
        : "Siswa",
    grade: ["Kelas 11", "Kelas 12", "Gap year"].includes(u.user_metadata.grade)
      ? u.user_metadata.grade
      : "Kelas 12",
    goal:
      Number.isInteger(u.user_metadata.goal) &&
      u.user_metadata.goal >= 100 &&
      u.user_metadata.goal <= 1000
        ? u.user_metadata.goal
        : 700,
  };
}
export async function getUser(_token?: string) {
  void _token;
  const client = await createSupabaseServerClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return profile(data.user);
}
export async function register(
  email: string,
  name: string,
  password: string,
  grade: string,
  goal: number,
  origin: string,
) {
  const client = await createSupabaseServerClient();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: name, grade, goal },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  if (error)
    throw new StorageError(
      "Pendaftaran gagal. Periksa email/kata sandi atau coba beberapa saat lagi.",
      400,
    );
  return {
    user: data.session && data.user ? profile(data.user) : null,
    confirmationRequired: !data.session,
  };
}
export async function authenticate(email: string, password: string) {
  const client = await createSupabaseServerClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return null;
  return data.user ? profile(data.user) : null;
}
export async function logout(_token?: string) {
  void _token;
  const client = await createSupabaseServerClient();
  const { error } = await client.auth.signOut();
  if (error) throw new StorageError("Gagal keluar. Silakan coba lagi.");
}
export async function getAttempt(
  id: string,
  userId: string,
): Promise<Attempt | null> {
  const { data, error } = await admin()
    .from("levelup_attempts")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  return checked(data, error) as Attempt | null;
}
export async function activeAttempt(
  userId: string,
  kind: string,
  topic: string | null,
): Promise<Attempt | null> {
  let query = admin()
    .from("levelup_attempts")
    .select("*")
    .eq("user_id", userId)
    .eq("kind", kind)
    .eq("status", "active");
  query = topic === null ? query.is("topic", null) : query.eq("topic", topic);
  const { data, error } = await query
    .order("started", { ascending: false })
    .limit(1)
    .maybeSingle();
  return checked(data, error) as Attempt | null;
}
export async function createAttempt(
  userId: string,
  kind: string,
  topic: string | null,
  questions: Question[],
) {
  const { data, error } = await admin().rpc("levelup_start_attempt", {
    p_user_id: userId,
    p_kind: kind,
    p_topic: topic,
    p_snapshot: questions,
  });
  return checked(data, error) as Attempt;
}
export async function saveAttempt(a: Attempt) {
  const { data, error } = await admin().rpc("levelup_save_attempt", {
    p_id: a.id,
    p_user_id: a.user_id,
    p_version: a.revision ?? 0,
    p_answers: a.answers,
    p_feedback: a.feedback,
    p_credits: a.credits,
  });
  checked(data, error);
  if (!data)
    throw new StorageError(
      "Jawaban belum tersimpan karena sesi berubah atau waktu habis. Muat ulang sesi.",
      409,
    );
  a.revision = (a.revision ?? 0) + 1;
}
export async function getMastery(userId: string): Promise<Mastery[]> {
  const { data, error } = await admin()
    .from("levelup_mastery")
    .select("data")
    .eq("user_id", userId)
    .order("topic");
  return checked(data, error)?.map((r) => r.data as Mastery) || [];
}
export async function finalize(
  a: Attempt,
  result: Attempt["result"],
  masteries: Mastery[],
  old: Mastery[],
) {
  const { data, error } = await admin().rpc("levelup_finalize_attempt", {
    p_id: a.id,
    p_user_id: a.user_id,
    p_version: a.revision ?? 0,
    p_result: result,
    p_masteries: masteries,
    p_old: Object.fromEntries(old.map((m) => [m.topic, m])),
  });
  checked(data, error);
}
export async function progress(userId: string) {
  const client = admin();
  const [m, h, d] = await Promise.all([
    getMastery(userId),
    client
      .from("levelup_attempts")
      .select("id,kind,topic,started,result")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("started", { ascending: false })
      .limit(30),
    client
      .from("levelup_activities")
      .select("day")
      .eq("user_id", userId)
      .order("day", { ascending: false }),
  ]);
  const history = checked(h.data, h.error) || [],
    days = [
      ...new Set((checked(d.data, d.error) || []).map((r) => r.day as string)),
    ];
  let streak = 0;
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(new Date());
  let cursor = Date.parse(today + "T00:00:00Z");
  if (!days.includes(today)) cursor -= 86400000;
  while (days.includes(new Date(cursor).toISOString().slice(0, 10))) {
    streak++;
    cursor -= 86400000;
  }
  return { mastery: m, history, days, streak };
}

/** Scoped recent exposure for fresh-first server-side selection. */
export async function seenQuestionIds(userId: string): Promise<string[]> {
  const { data, error } = await admin()
    .from("levelup_attempts")
    .select("snapshot")
    .eq("user_id", userId)
    .order("started", { ascending: false })
    .limit(30);
  return [
    ...new Set(
      (checked(data, error) || []).flatMap((r) =>
        (r.snapshot as Question[]).map((q) => q.id),
      ),
    ),
  ];
}
