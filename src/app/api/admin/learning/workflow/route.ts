import { createClient } from "@supabase/supabase-js";
import {
  adminError,
  adminIdentity,
  assertOrigin,
} from "@/features/content/auth";
import { StorageError } from "@/lib/store-errors";

export const runtime = "nodejs";

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new StorageError("Database learning belum dikonfigurasi.", 500);
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function requireAdmin() {
  const identity = await adminIdentity();
  if (identity.role !== "ADMIN")
    throw new StorageError("Akses admin ditolak.", 403);
  return identity;
}

async function moduleSnapshot(client: ReturnType<typeof db>) {
  const [
    { data: modules, error: moduleError },
    { data: lessons, error: lessonError },
    { data: reviews, error: reviewError },
  ] = await Promise.all([
    client
      .from("learning_modules")
      .select(
        "id,code,title,status,level,estimated_minutes,updated_at,published_at",
      )
      .order("updated_at", { ascending: false }),
    client
      .from("learning_lessons")
      .select("id,module_id,title,status,estimated_minutes,sort_order")
      .order("sort_order"),
    client
      .from("content_reviews")
      .select("id,entity_type,entity_id,status,notes,created_at")
      .in("entity_type", ["LEARNING_MODULE", "LESSON"])
      .order("created_at", { ascending: false }),
  ]);
  const error = moduleError || lessonError || reviewError;
  if (error) throw error;
  return {
    modules: modules || [],
    lessons: lessons || [],
    reviews: reviews || [],
  };
}

export async function GET() {
  try {
    await requireAdmin();
    return Response.json(
      { data: await moduleSnapshot(db()) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return adminError(error);
  }
}

type Body = { action?: string; module_id?: string };

export async function POST(request: Request) {
  try {
    await requireAdmin();
    assertOrigin(request);
    const body = (await request.json()) as Body;
    const action = String(body.action || "");
    const moduleId = String(body.module_id || "");
    if (!moduleId) throw new StorageError("Module tidak valid.", 400);
    const client = db();

    const { data: module, error: moduleError } = await client
      .from("learning_modules")
      .select("id,status,title")
      .eq("id", moduleId)
      .single();
    if (moduleError || !module)
      throw new StorageError("Module tidak ditemukan.", 404);

    const { data: lessons, error: lessonError } = await client
      .from("learning_lessons")
      .select("id,status,title")
      .eq("module_id", moduleId)
      .order("sort_order");
    if (lessonError) throw lessonError;

    if (action === "submit_review") {
      if (module.status !== "DRAFT")
        throw new StorageError(
          "Hanya module draft yang dapat dikirim ke review.",
          409,
        );
      if (!lessons?.length)
        throw new StorageError(
          "Module harus memiliki minimal satu lesson.",
          400,
        );
      const lessonIds = lessons.map((item) => item.id);
      const { data: blocks, error: blockError } = await client
        .from("lesson_blocks")
        .select("lesson_id,id,content_json")
        .in("lesson_id", lessonIds);
      if (blockError) throw blockError;
      for (const lesson of lessons) {
        const ownBlocks = (blocks || []).filter(
          (block) => block.lesson_id === lesson.id,
        );
        if (!ownBlocks.length)
          throw new StorageError(
            `Lesson '${lesson.title}' belum memiliki isi.`,
            400,
          );
        if (
          ownBlocks.some(
            (block) =>
              !block.content_json ||
              Object.keys(block.content_json).length === 0,
          )
        )
          throw new StorageError(
            `Lesson '${lesson.title}' memiliki block kosong.`,
            400,
          );
      }
      const { error: lessonUpdateError } = await client
        .from("learning_lessons")
        .update({ status: "IN_REVIEW", updated_at: new Date().toISOString() })
        .in("id", lessonIds);
      if (lessonUpdateError) throw lessonUpdateError;
      const { error: moduleUpdateError } = await client
        .from("learning_modules")
        .update({ status: "IN_REVIEW", updated_at: new Date().toISOString() })
        .eq("id", moduleId);
      if (moduleUpdateError) throw moduleUpdateError;
    } else if (action === "publish") {
      if (module.status !== "QA_PASSED")
        throw new StorageError("Module harus lolos QA sebelum dipublish.", 409);
      if (
        !lessons?.length ||
        lessons.some((lesson) => lesson.status !== "QA_PASSED")
      )
        throw new StorageError(
          "Semua lesson harus lolos QA sebelum module dipublish.",
          409,
        );
      const { data: moduleReview } = await client
        .from("content_reviews")
        .select("status")
        .eq("entity_type", "LEARNING_MODULE")
        .eq("entity_id", moduleId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (moduleReview?.status !== "APPROVED")
        throw new StorageError("Approval reviewer terbaru diperlukan.", 409);
      for (const lesson of lessons) {
        const { data: lessonReview } = await client
          .from("content_reviews")
          .select("status")
          .eq("entity_type", "LESSON")
          .eq("entity_id", lesson.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (lessonReview?.status !== "APPROVED")
          throw new StorageError(
            `Lesson '${lesson.title}' belum mendapat approval reviewer.`,
            409,
          );
      }
      const now = new Date().toISOString();
      const { error: lessonPublishError } = await client
        .from("learning_lessons")
        .update({ status: "PUBLISHED", updated_at: now })
        .in(
          "id",
          lessons.map((lesson) => lesson.id),
        );
      if (lessonPublishError) throw lessonPublishError;
      const { error: modulePublishError } = await client
        .from("learning_modules")
        .update({ status: "PUBLISHED", published_at: now, updated_at: now })
        .eq("id", moduleId);
      if (modulePublishError) throw modulePublishError;
    } else if (action === "return_to_draft") {
      if (module.status === "PUBLISHED")
        throw new StorageError(
          "Module published tidak dapat dikembalikan ke draft langsung.",
          409,
        );
      const now = new Date().toISOString();
      if (lessons?.length) {
        const { error } = await client
          .from("learning_lessons")
          .update({ status: "DRAFT", updated_at: now })
          .in(
            "id",
            lessons.map((lesson) => lesson.id),
          );
        if (error) throw error;
      }
      const { error } = await client
        .from("learning_modules")
        .update({ status: "DRAFT", updated_at: now })
        .eq("id", moduleId);
      if (error) throw error;
    } else {
      throw new StorageError("Action workflow learning tidak valid.", 400);
    }

    return Response.json(
      { data: await moduleSnapshot(client) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return adminError(error);
  }
}
