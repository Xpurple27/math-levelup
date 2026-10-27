import "server-only";

import { createClient } from "@supabase/supabase-js";
import { onlineBackend } from "@/lib/backend";
import { localContentDatabase } from "@/features/content/db";

/**
 * Return only subtopics that have a published module and at least one published
 * lesson. The query intentionally supports both hosted Supabase and the local
 * PGlite content adapter so recommendation behavior can be verified in E2E.
 */
export async function publishedLearningCoverage(): Promise<string[]> {
  try {
    if (onlineBackend()) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) return [];
      const client = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: modules, error: moduleError } = await client
        .from("learning_modules")
        .select("id,subtopic_id")
        .eq("status", "PUBLISHED");
      if (moduleError || !modules?.length) return [];

      const moduleIds = modules.map((item) => item.id);
      const { data: lessons, error: lessonError } = await client
        .from("learning_lessons")
        .select("module_id")
        .in("module_id", moduleIds)
        .eq("status", "PUBLISHED");
      if (lessonError || !lessons?.length) return [];

      const readyModules = new Set(lessons.map((item) => item.module_id));
      return [
        ...new Set(
          modules
            .filter((item) => readyModules.has(item.id))
            .map((item) => item.subtopic_id)
            .filter((id): id is string => typeof id === "string" && id.length > 0),
        ),
      ];
    }

    const db = await localContentDatabase();
    if (!db) return [];
    const result = await db.query<{ subtopic_id: string }>(
      `SELECT DISTINCT m.subtopic_id
       FROM public.learning_modules m
       JOIN public.learning_lessons l ON l.module_id=m.id
       WHERE m.status='PUBLISHED' AND l.status='PUBLISHED'
       ORDER BY m.subtopic_id`,
    );
    return result.rows.map((row) => row.subtopic_id);
  } catch {
    return [];
  }
}
