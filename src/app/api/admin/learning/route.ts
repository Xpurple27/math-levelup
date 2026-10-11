import { createClient } from "@supabase/supabase-js";
import { adminIdentity, adminError, assertOrigin } from "@/features/content/auth";
import { StorageError } from "@/lib/store-errors";

export const runtime = "nodejs";

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new StorageError("Database learning belum dikonfigurasi.", 500);
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function requireAdmin() {
  const identity = await adminIdentity();
  if (identity.role !== "ADMIN") throw new StorageError("Akses admin ditolak.", 403);
  return identity;
}

export async function GET() {
  try {
    await requireAdmin();
    const client = db();
    const [{ data: modules, error: moduleError }, { data: lessons, error: lessonError }, { data: blocks, error: blockError }, { data: subtopics, error: taxonomyError }] = await Promise.all([
      client.from("learning_modules").select("id,subtopic_id,code,slug,title,description,level,status,sort_order,estimated_minutes,updated_at").order("sort_order").order("title"),
      client.from("learning_lessons").select("id,module_id,title,slug,description,sort_order,status,estimated_minutes,updated_at").order("sort_order").order("title"),
      client.from("lesson_blocks").select("id,lesson_id,block_type,sort_order,content_json,updated_at").order("sort_order"),
      client.from("subtopics").select("id,name,topic_id,topics(id,name,domain_id,domains(id,name))").eq("status", "ACTIVE").order("name"),
    ]);
    const error = moduleError || lessonError || blockError || taxonomyError;
    if (error) throw error;
    return Response.json({ data: { modules: modules || [], lessons: lessons || [], blocks: blocks || [], subtopics: subtopics || [] } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return adminError(error);
  }
}

type Body = { action?: string; payload?: Record<string, unknown> };

export async function POST(request: Request) {
  try {
    await requireAdmin();
    assertOrigin(request);
    const body = (await request.json()) as Body;
    const action = body.action || "";
    const payload = body.payload || {};
    const client = db();

    if (action === "create_module") {
      const title = String(payload.title || "").trim();
      const subtopicId = String(payload.subtopic_id || "");
      if (!title || !subtopicId) throw new StorageError("Judul dan subtopik wajib diisi.", 400);
      const slug = String(payload.slug || title).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const code = String(payload.code || `LM-${Date.now().toString(36).toUpperCase()}`);
      const { data, error } = await client.from("learning_modules").insert({ subtopic_id: subtopicId, code, slug, title, description: String(payload.description || ""), level: String(payload.level || "FOUNDATION"), estimated_minutes: Number(payload.estimated_minutes || 20), sort_order: Number(payload.sort_order || 0) }).select().single();
      if (error) throw error;
      return Response.json({ data });
    }

    if (action === "create_lesson") {
      const moduleId = String(payload.module_id || "");
      const title = String(payload.title || "").trim();
      if (!moduleId || !title) throw new StorageError("Module dan judul lesson wajib diisi.", 400);
      const slug = String(payload.slug || title).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const { data, error } = await client.from("learning_lessons").insert({ module_id: moduleId, title, slug, description: String(payload.description || ""), estimated_minutes: Number(payload.estimated_minutes || 10), sort_order: Number(payload.sort_order || 0) }).select().single();
      if (error) throw error;
      return Response.json({ data });
    }

    if (action === "save_blocks") {
      const lessonId = String(payload.lesson_id || "");
      const blocks = Array.isArray(payload.blocks) ? payload.blocks : [];
      if (!lessonId) throw new StorageError("Lesson tidak valid.", 400);
      if (blocks.length > 100) throw new StorageError("Maksimal 100 block per lesson.", 400);
      const allowed = new Set(["HEADING", "TEXT", "LATEX", "IMAGE", "CALLOUT", "EXAMPLE", "COMMON_MISTAKE", "SUMMARY"]);
      const rows = blocks.map((raw, index) => {
        const item = raw as Record<string, unknown>;
        const blockType = String(item.block_type || "TEXT");
        if (!allowed.has(blockType)) throw new StorageError("Tipe block tidak valid.", 400);
        return { lesson_id: lessonId, block_type: blockType, sort_order: index, content_json: typeof item.content_json === "object" && item.content_json ? item.content_json : { text: "" } };
      });
      const { error: deleteError } = await client.from("lesson_blocks").delete().eq("lesson_id", lessonId);
      if (deleteError) throw deleteError;
      if (rows.length) {
        const { error: insertError } = await client.from("lesson_blocks").insert(rows);
        if (insertError) throw insertError;
      }
      const { data, error } = await client.from("lesson_blocks").select("id,lesson_id,block_type,sort_order,content_json,updated_at").eq("lesson_id", lessonId).order("sort_order");
      if (error) throw error;
      return Response.json({ data: data || [] });
    }

    throw new StorageError("Action learning tidak valid.", 400);
  } catch (error) {
    return adminError(error);
  }
}
