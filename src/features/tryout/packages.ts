import "server-only";

import { createClient } from "@supabase/supabase-js";
import { publishedQuestions } from "@/features/content/runtime";
import type { Question } from "@/lib/content";

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Tryout database belum dikonfigurasi.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export type TryoutPackageCard = {
  id: string;
  code: string;
  slug: string;
  suiteCode: string;
  suiteTitle: string;
  title: string;
  description: string;
  access: "FREE" | "PREMIUM";
  questionCount: number;
  durationSeconds: number;
  sectionOrder: number;
  section: { id: string; code: string; name: string };
};

export async function listTryoutPackages(): Promise<TryoutPackageCard[]> {
  const client = db();
  const { data, error } = await client
    .from("tryout_packages")
    .select("id,code,slug,suite_code,suite_title,title,description,access,question_count,duration_seconds,section_order,sort_order,section_id,exam_sections(id,code,name),tryout_package_questions(id)")
    .eq("status", "PUBLISHED")
    .order("sort_order");
  if (error) throw error;

  return (data || []).flatMap((row) => {
    const section = row.exam_sections as unknown as { id: string; code: string; name: string } | null;
    const actual = Array.isArray(row.tryout_package_questions) ? row.tryout_package_questions.length : 0;
    if (!section || actual !== row.question_count) return [];
    return [{
      id: row.id,
      code: row.code,
      slug: row.slug,
      suiteCode: row.suite_code,
      suiteTitle: row.suite_title,
      title: row.title,
      description: row.description,
      access: row.access,
      questionCount: row.question_count,
      durationSeconds: row.duration_seconds,
      sectionOrder: row.section_order,
      section,
    } satisfies TryoutPackageCard];
  });
}

export async function loadTryoutPackage(target: string): Promise<{ card: TryoutPackageCard; questions: Question[] } | null> {
  const cards = await listTryoutPackages();
  const card = cards.find((item) => item.access === "FREE" && (item.slug === target || item.code === target));
  if (!card) return null;

  const client = db();
  const { data, error } = await client
    .from("tryout_package_questions")
    .select("sort_order,question_version_id")
    .eq("tryout_package_id", card.id)
    .order("sort_order");
  if (error) throw error;

  const order = new Map((data || []).map((item, index) => [item.question_version_id, index]));
  const ids = new Set(order.keys());
  const questions = (await publishedQuestions())
    .filter((question) => question.versionId && ids.has(question.versionId))
    .sort((a, b) => (order.get(a.versionId || "") ?? 9999) - (order.get(b.versionId || "") ?? 9999));

  if (questions.length !== card.questionCount) return null;
  return { card, questions };
}
