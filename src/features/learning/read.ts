import "server-only";

import { createClient } from "@supabase/supabase-js";
import { onlineBackend } from "@/lib/backend";
import { localContentDatabase } from "@/features/content/db";
import { mediaUrl } from "@/features/content/runtime";
import type { Media } from "@/features/content/model";

export type LearningPayload = {
  modules: Record<string, unknown>[];
  lessons: Record<string, unknown>[];
  blocks: Record<string, unknown>[];
  assignments: Record<string, unknown>[];
};

async function hostedLearning(): Promise<LearningPayload> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Learning database belum dikonfigurasi.");
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: modules, error: moduleError } = await client
    .from("learning_modules")
    .select(
      "id,subtopic_id,code,slug,title,description,level,status,sort_order,estimated_minutes,subtopics(id,name,topic_id,topics(id,name,domain_id,domains(id,name)))",
    )
    .eq("status", "PUBLISHED")
    .order("sort_order")
    .order("title");
  if (moduleError) throw moduleError;

  const moduleIds = (modules || []).map((item) => item.id);
  if (!moduleIds.length)
    return { modules: [], lessons: [], blocks: [], assignments: [] };

  const { data: lessons, error: lessonError } = await client
    .from("learning_lessons")
    .select(
      "id,module_id,title,slug,description,sort_order,status,estimated_minutes",
    )
    .in("module_id", moduleIds)
    .eq("status", "PUBLISHED")
    .order("sort_order")
    .order("title");
  if (lessonError) throw lessonError;

  const lessonIds = (lessons || []).map((item) => item.id);
  if (!lessonIds.length)
    return {
      modules: (modules || []) as Record<string, unknown>[],
      lessons: [],
      blocks: [],
      assignments: [],
    };

  const [blockResult, assignmentResult] = await Promise.all([
    client
      .from("lesson_blocks")
      .select("id,lesson_id,block_type,sort_order,content_json")
      .in("lesson_id", lessonIds)
      .order("sort_order"),
    client
      .from("lesson_question_assignments")
      .select(
        "id,lesson_id,question_version_id,role,sort_order,question_versions:question_versions!lesson_question_assignments_question_version_id_fkey(id,question_id,question_type,difficulty,stem_md,status,questions:questions!question_versions_question_id_fkey(code))",
      )
      .in("lesson_id", lessonIds)
      .order("sort_order"),
  ]);
  if (blockResult.error || assignmentResult.error)
    throw blockResult.error || assignmentResult.error;

  const blocks = blockResult.data || [];
  const mediaIds = [
    ...new Set(
      blocks
        .map((block) => {
          const content = block.content_json as Record<string, unknown> | null;
          return typeof content?.media_id === "string" ? content.media_id : "";
        })
        .filter(Boolean),
    ),
  ];

  let mediaMap = new Map<string, { url: string; alt: string }>();
  if (mediaIds.length) {
    const { data: media, error: mediaError } = await client
      .from("media_assets")
      .select(
        "id,storage_provider,storage_path,alt_text,original_filename",
      )
      .in("id", mediaIds);
    if (mediaError) throw mediaError;
    const resolved = await Promise.all(
      (media || []).map(async (item) => ({
        id: item.id,
        url: await mediaUrl(
          item as Pick<Media, "storage_provider" | "storage_path">,
        ),
        alt: item.alt_text || item.original_filename,
      })),
    );
    mediaMap = new Map(
      resolved.map((item) => [item.id, { url: item.url, alt: item.alt }]),
    );
  }

  const safeBlocks = blocks.map((block) => {
    const content = {
      ...((block.content_json || {}) as Record<string, unknown>),
    };
    const mediaId = typeof content.media_id === "string" ? content.media_id : "";
    if (mediaId && mediaMap.has(mediaId)) {
      content.url = mediaMap.get(mediaId)?.url || "";
      content.alt =
        content.alt || mediaMap.get(mediaId)?.alt || "Media lesson";
    }
    return { ...block, content_json: content };
  });

  const safeAssignments = (assignmentResult.data || []).filter((item) => {
    const version = item.question_versions as unknown as { status?: string } | null;
    return version?.status === "PUBLISHED";
  });

  return {
    modules: (modules || []) as Record<string, unknown>[],
    lessons: (lessons || []) as Record<string, unknown>[],
    blocks: safeBlocks as Record<string, unknown>[],
    assignments: safeAssignments as Record<string, unknown>[],
  };
}

async function localLearning(): Promise<LearningPayload> {
  const db = await localContentDatabase();
  if (!db) return { modules: [], lessons: [], blocks: [], assignments: [] };

  const moduleResult = await db.query<{
    id: string;
    subtopic_id: string;
    code: string;
    slug: string;
    title: string;
    description: string;
    level: string;
    status: string;
    sort_order: number;
    estimated_minutes: number;
    subtopic_name: string;
    topic_id: string;
    topic_name: string;
    domain_id: string;
    domain_name: string;
  }>(
    `SELECT m.id,m.subtopic_id,m.code,m.slug,m.title,m.description,m.level,m.status,
            m.sort_order,m.estimated_minutes,st.name AS subtopic_name,
            t.id AS topic_id,t.name AS topic_name,d.id AS domain_id,d.name AS domain_name
     FROM public.learning_modules m
     JOIN public.subtopics st ON st.id=m.subtopic_id
     JOIN public.topics t ON t.id=st.topic_id
     JOIN public.domains d ON d.id=t.domain_id
     WHERE m.status='PUBLISHED'
     ORDER BY m.sort_order,m.title`,
  );

  const modules = moduleResult.rows.map((row) => ({
    id: row.id,
    subtopic_id: row.subtopic_id,
    code: row.code,
    slug: row.slug,
    title: row.title,
    description: row.description,
    level: row.level,
    status: row.status,
    sort_order: row.sort_order,
    estimated_minutes: row.estimated_minutes,
    subtopics: {
      id: row.subtopic_id,
      name: row.subtopic_name,
      topic_id: row.topic_id,
      topics: {
        id: row.topic_id,
        name: row.topic_name,
        domain_id: row.domain_id,
        domains: { id: row.domain_id, name: row.domain_name },
      },
    },
  }));
  if (!modules.length)
    return { modules: [], lessons: [], blocks: [], assignments: [] };

  const ids = modules.map((item) => item.id);
  const lessons = (
    await db.query<Record<string, unknown>>(
      `SELECT id,module_id,title,slug,description,sort_order,status,estimated_minutes
       FROM public.learning_lessons
       WHERE status='PUBLISHED' AND module_id = ANY($1::uuid[])
       ORDER BY sort_order,title`,
      [ids],
    )
  ).rows;
  if (!lessons.length)
    return { modules, lessons: [], blocks: [], assignments: [] };

  const lessonIds = lessons.map((item) => String(item.id));
  const blocks = (
    await db.query<Record<string, unknown>>(
      `SELECT id,lesson_id,block_type,sort_order,content_json
       FROM public.lesson_blocks
       WHERE lesson_id = ANY($1::uuid[])
       ORDER BY sort_order`,
      [lessonIds],
    )
  ).rows;
  const assignmentRows = (
    await db.query<{
      id: string;
      lesson_id: string;
      question_version_id: string;
      role: string;
      sort_order: number;
      question_id: string;
      question_type: string;
      difficulty: string;
      stem_md: string;
      status: string;
      code: string;
    }>(
      `SELECT a.id,a.lesson_id,a.question_version_id,a.role,a.sort_order,
              v.question_id,v.question_type,v.difficulty,v.stem_md,v.status,q.code
       FROM public.lesson_question_assignments a
       JOIN public.question_versions v ON v.id=a.question_version_id
       JOIN public.questions q ON q.id=v.question_id
       WHERE a.lesson_id = ANY($1::uuid[]) AND v.status='PUBLISHED'
       ORDER BY a.sort_order`,
      [lessonIds],
    )
  ).rows;
  const assignments = assignmentRows.map((row) => ({
    id: row.id,
    lesson_id: row.lesson_id,
    question_version_id: row.question_version_id,
    role: row.role,
    sort_order: row.sort_order,
    question_versions: {
      id: row.question_version_id,
      question_id: row.question_id,
      question_type: row.question_type,
      difficulty: row.difficulty,
      stem_md: row.stem_md,
      status: row.status,
      questions: { code: row.code },
    },
  }));

  return { modules, lessons, blocks, assignments };
}

export async function loadPublishedLearning(): Promise<LearningPayload> {
  return onlineBackend() ? hostedLearning() : localLearning();
}
