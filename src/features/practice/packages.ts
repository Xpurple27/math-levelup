import "server-only";

import { createClient } from "@supabase/supabase-js";
import { publishedQuestions } from "@/features/content/runtime";
import type { Question } from "@/lib/content";

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Practice database belum dikonfigurasi.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type PracticePackageCard = {
  id: string;
  code: string;
  slug: string;
  title: string;
  description: string;
  access: "FREE" | "PREMIUM";
  estimatedMinutes: number;
  section: { id: string; code: string; name: string };
  domain: { id: string; name: string; description: string };
  questionCount: number;
  difficulty: { basic: number; medium: number; hard: number };
};

type PackageQuestionRow = {
  sort_order: number;
  question_version_id: string;
  question_versions?: { difficulty?: string; status?: string } | null;
};

export async function listPracticePackages(): Promise<PracticePackageCard[]> {
  const client = db();
  const { data, error } = await client
    .from("practice_packages")
    .select(
      "id,code,slug,title,description,access,estimated_minutes,sort_order,section_id,domain_id,exam_sections(id,code,name),domains(id,name,description),practice_package_questions(sort_order,question_version_id,question_versions(difficulty,status))",
    )
    .eq("status", "PUBLISHED")
    .order("sort_order")
    .order("title");
  if (error) throw error;

  return (data || []).flatMap((row) => {
    const section = row.exam_sections as unknown as { id: string; code: string; name: string } | null;
    const domain = row.domains as unknown as { id: string; name: string; description?: string | null } | null;
    if (!domain) return [];

    const questions = ((row.practice_package_questions || []) as unknown as PackageQuestionRow[])
      .filter((item) => item.question_versions?.status === "PUBLISHED")
      .sort((a, b) => a.sort_order - b.sort_order);
    const difficulty = { basic: 0, medium: 0, hard: 0 };
    for (const item of questions) {
      const value = item.question_versions?.difficulty;
      if (value === "BASIC") difficulty.basic += 1;
      if (value === "MEDIUM") difficulty.medium += 1;
      if (value === "HARD") difficulty.hard += 1;
    }

    return [{
      id: row.id,
      code: row.code,
      slug: row.slug,
      title: row.title,
      description: row.description,
      access: row.access,
      estimatedMinutes: row.estimated_minutes,
      section: section || { id: row.section_id, code: "", name: "" },
      domain: {
        id: domain.id || row.domain_id,
        name: domain.name || "Materi",
        description: domain.description || "",
      },
      questionCount: questions.length,
      difficulty,
    } satisfies PracticePackageCard];
  });
}

async function domainForSubtopic(target: string): Promise<string | null> {
  const client = db();
  const { data } = await client
    .from("subtopics")
    .select("topics(domain_id)")
    .eq("id", target)
    .maybeSingle();
  const topic = data?.topics as unknown as { domain_id?: string } | null;
  return topic?.domain_id || null;
}

export async function loadPracticePackage(target: string): Promise<{ card: PracticePackageCard; questions: Question[] } | null> {
  const cards = await listPracticePackages();
  let card = cards.find((item) => item.access === "FREE" && (item.slug === target || item.domain.id === target));
  if (!card) {
    const domainId = await domainForSubtopic(target);
    if (domainId) card = cards.find((item) => item.access === "FREE" && item.domain.id === domainId);
  }
  if (!card) return null;

  const client = db();
  const { data, error } = await client
    .from("practice_package_questions")
    .select("sort_order,question_version_id")
    .eq("practice_package_id", card.id)
    .order("sort_order");
  if (error) throw error;

  const order = new Map((data || []).map((item, index) => [item.question_version_id, index]));
  const ids = new Set(order.keys());
  const questions = (await publishedQuestions())
    .filter((question) => question.versionId && ids.has(question.versionId))
    .sort((a, b) => (order.get(a.versionId || "") ?? 9999) - (order.get(b.versionId || "") ?? 9999));

  if (!questions.length) return null;
  return { card, questions };
}
