import { createClient } from "@supabase/supabase-js";
import { adminError, adminIdentity, assertOrigin } from "@/features/content/auth";
import { StorageError } from "@/lib/store-errors";

export const runtime = "nodejs";

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new StorageError("Database learning belum dikonfigurasi.", 500);
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function requireReviewer() {
  const identity = await adminIdentity();
  if (identity.role !== "REVIEWER") throw new StorageError("Akses reviewer ditolak.", 403);
  return identity;
}

async function queue(client: ReturnType<typeof db>) {
  const { data: modules, error: moduleError } = await client
    .from("learning_modules")
    .select("id,code,title,description,level,status,estimated_minutes,subtopic_id")
    .eq("status", "IN_REVIEW")
    .order("updated_at", { ascending: true });
  if (moduleError) throw moduleError;
  const moduleIds = (modules || []).map((item) => item.id);
  if (!moduleIds.length) return { modules: [], lessons: [], blocks: [], assignments: [], questions: [] };

  const { data: lessons, error: lessonError } = await client
    .from("learning_lessons")
    .select("id,module_id,title,description,status,estimated_minutes,sort_order")
    .in("module_id", moduleIds)
    .order("sort_order");
  if (lessonError) throw lessonError;
  const lessonIds = (lessons || []).map((item) => item.id);
  const [{ data: blocks, error: blockError }, { data: assignments, error: assignmentError }] = await Promise.all([
    lessonIds.length
      ? client.from("lesson_blocks").select("id,lesson_id,block_type,sort_order,content_json").in("lesson_id", lessonIds).order("sort_order")
      : Promise.resolve({ data: [], error: null }),
    lessonIds.length
      ? client.from("lesson_question_assignments").select("id,lesson_id,question_version_id,role,sort_order").in("lesson_id", lessonIds).order("sort_order")
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (blockError || assignmentError) throw blockError || assignmentError;
  const versionIds = (assignments || []).map((item) => item.question_version_id);
  const { data: questions, error: questionError } = versionIds.length
    ? await client.from("levelup_question_bank").select("version_id,code,stem_md,difficulty,section,domain,topic,subtopic").in("version_id", versionIds)
    : { data: [], error: null };
  if (questionError) throw questionError;
  return { modules: modules || [], lessons: lessons || [], blocks: blocks || [], assignments: assignments || [], questions: questions || [] };
}

export async function GET() {
  try {
    await requireReviewer();
    return Response.json({ data: await queue(db()) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return adminError(error);
  }
}

type Body = { module_id?: string; decision?: string; notes?: string };

export async function POST(request: Request) {
  try {
    const identity = await requireReviewer();
    assertOrigin(request);
    const body = (await request.json()) as Body;
    const moduleId = String(body.module_id || "");
    const decision = String(body.decision || "");
    const notes = String(body.notes || "").trim().slice(0, 4000);
    if (!moduleId || !["APPROVED", "CHANGES_REQUESTED", "REJECTED"].includes(decision))
      throw new StorageError("Keputusan review tidak valid.", 400);
    if (decision !== "APPROVED" && !notes) throw new StorageError("Catatan wajib untuk perubahan atau penolakan.", 400);

    const client = db();
    const { data: module, error: moduleError } = await client.from("learning_modules").select("id,status,title").eq("id", moduleId).single();
    if (moduleError || !module) throw new StorageError("Module tidak ditemukan.", 404);
    if (module.status !== "IN_REVIEW") throw new StorageError("Module ini tidak lagi berada dalam review.", 409);
    const { data: lessons, error: lessonError } = await client.from("learning_lessons").select("id,status,title").eq("module_id", moduleId).order("sort_order");
    if (lessonError) throw lessonError;
    const nextStatus = decision === "APPROVED" ? "QA_PASSED" : "DRAFT";
    const reviewRows = [
      { entity_type: "LEARNING_MODULE", entity_id: moduleId, review_type: "EDITORIAL", status: decision, reviewer_id: identity.user.id, notes },
      ...(lessons || []).map((lesson) => ({ entity_type: "LESSON", entity_id: lesson.id, review_type: "EDITORIAL", status: decision, reviewer_id: identity.user.id, notes })),
    ];
    const { error: reviewError } = await client.from("content_reviews").insert(reviewRows);
    if (reviewError) throw reviewError;
    const now = new Date().toISOString();
    if (lessons?.length) {
      const { error } = await client.from("learning_lessons").update({ status: nextStatus, updated_at: now }).in("id", lessons.map((item) => item.id));
      if (error) throw error;
    }
    const { error: updateError } = await client.from("learning_modules").update({ status: nextStatus, updated_at: now }).eq("id", moduleId);
    if (updateError) throw updateError;
    return Response.json({ data: await queue(client) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return adminError(error);
  }
}
