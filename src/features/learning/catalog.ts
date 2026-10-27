import "server-only";

import { createClient } from "@supabase/supabase-js";

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Return only subtopics that have a published module and at least one published
 * lesson. Recommendations can use this list to avoid routing students into an
 * empty learning path.
 */
export async function publishedLearningCoverage(): Promise<string[]> {
  const client = db();
  if (!client) return [];

  try {
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
  } catch {
    return [];
  }
}
