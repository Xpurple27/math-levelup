import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { cookie } from "@/features/http";
import { mediaUrl } from "@/features/content/runtime";
import type { Media } from "@/features/content/model";
import { getUser } from "@/lib/store";

export const runtime = "nodejs";

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Learning database belum dikonfigurasi.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET() {
  try {
    const token = (await cookies()).get(cookie)?.value;
    const user = await getUser(token);
    if (!user) return Response.json({ error: "Masuk terlebih dahulu." }, { status: 401 });

    const client = db();
    const { data: modules, error: moduleError } = await client
      .from("learning_modules")
      .select("id,subtopic_id,code,slug,title,description,level,status,sort_order,estimated_minutes,subtopics(id,name,topic_id,topics(id,name,domain_id,domains(id,name)))")
      .eq("status", "PUBLISHED")
      .order("sort_order")
      .order("title");
    if (moduleError) throw moduleError;

    const moduleIds = (modules || []).map((item) => item.id);
    if (!moduleIds.length) {
      return Response.json(
        { data: { modules: [], lessons: [], blocks: [], assignments: [] } },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const { data: lessons, error: lessonError } = await client
      .from("learning_lessons")
      .select("id,module_id,title,slug,description,sort_order,status,estimated_minutes")
      .in("module_id", moduleIds)
      .eq("status", "PUBLISHED")
      .order("sort_order")
      .order("title");
    if (lessonError) throw lessonError;

    const lessonIds = (lessons || []).map((item) => item.id);
    if (!lessonIds.length) {
      return Response.json(
        { data: { modules: modules || [], lessons: [], blocks: [], assignments: [] } },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const [{ data: blocks, error: blockError }, { data: assignments, error: assignmentError }] = await Promise.all([
      client
        .from("lesson_blocks")
        .select("id,lesson_id,block_type,sort_order,content_json")
        .in("lesson_id", lessonIds)
        .order("sort_order"),
      client
        .from("lesson_question_assignments")
        .select("id,lesson_id,question_version_id,role,sort_order,question_versions(id,question_id,question_type,difficulty,stem_md,status,questions(code))")
        .in("lesson_id", lessonIds)
        .order("sort_order"),
    ]);
    if (blockError || assignmentError) throw blockError || assignmentError;

    const mediaIds = [...new Set((blocks || []).map((block) => {
      const content = block.content_json as Record<string, unknown> | null;
      return typeof content?.media_id === "string" ? content.media_id : "";
    }).filter(Boolean))];

    let mediaMap = new Map<string, { url: string; alt: string }>();
    if (mediaIds.length) {
      const { data: media, error: mediaError } = await client
        .from("media_assets")
        .select("id,storage_provider,storage_path,alt_text,original_filename")
        .in("id", mediaIds);
      if (mediaError) throw mediaError;
      const resolved = await Promise.all(
        (media || []).map(async (item) => ({
          id: item.id,
          url: await mediaUrl(item as Pick<Media, "storage_provider" | "storage_path">),
          alt: item.alt_text || item.original_filename,
        })),
      );
      mediaMap = new Map(resolved.map((item) => [item.id, { url: item.url, alt: item.alt }]));
    }

    const safeBlocks = (blocks || []).map((block) => {
      const content = { ...((block.content_json || {}) as Record<string, unknown>) };
      const mediaId = typeof content.media_id === "string" ? content.media_id : "";
      if (mediaId && mediaMap.has(mediaId)) {
        content.url = mediaMap.get(mediaId)?.url || "";
        content.alt = content.alt || mediaMap.get(mediaId)?.alt || "Media lesson";
      }
      return { ...block, content_json: content };
    });

    const safeAssignments = (assignments || []).filter((item) => {
      const version = item.question_versions as unknown as { status?: string } | null;
      return version?.status === "PUBLISHED";
    });

    return Response.json(
      { data: { modules: modules || [], lessons: lessons || [], blocks: safeBlocks, assignments: safeAssignments } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ error: "Materi belajar belum dapat dimuat." }, { status: 500 });
  }
}
