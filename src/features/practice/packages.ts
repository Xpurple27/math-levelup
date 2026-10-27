import "server-only";

import { createClient } from "@supabase/supabase-js";
import { publishedQuestions } from "@/features/content/runtime";
import { localContentDatabase } from "@/features/content/db";
import { onlineBackend } from "@/lib/backend";
import type { Question } from "@/lib/content";

function hostedDb() {
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

async function hostedPackages(): Promise<PracticePackageCard[]> {
  const client = hostedDb();
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
    const section = row.exam_sections as unknown as {
      id: string;
      code: string;
      name: string;
    } | null;
    const domain = row.domains as unknown as {
      id: string;
      name: string;
      description?: string | null;
    } | null;
    if (!domain) return [];

    const questions = (
      (row.practice_package_questions || []) as unknown as PackageQuestionRow[]
    )
      .filter((item) => item.question_versions?.status === "PUBLISHED")
      .sort((a, b) => a.sort_order - b.sort_order);
    const difficulty = { basic: 0, medium: 0, hard: 0 };
    for (const item of questions) {
      const value = item.question_versions?.difficulty;
      if (value === "BASIC") difficulty.basic += 1;
      if (value === "MEDIUM") difficulty.medium += 1;
      if (value === "HARD") difficulty.hard += 1;
    }

    return [
      {
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
      } satisfies PracticePackageCard,
    ];
  });
}

async function localPackages(): Promise<PracticePackageCard[]> {
  const db = await localContentDatabase();
  if (!db) return [];
  const result = await db.query<{
    id: string;
    code: string;
    slug: string;
    title: string;
    description: string;
    access: "FREE" | "PREMIUM";
    estimated_minutes: number;
    section_id: string;
    section_code: string;
    section_name: string;
    domain_id: string;
    domain_name: string;
    domain_description: string;
    question_count: number | string;
    basic_count: number | string;
    medium_count: number | string;
    hard_count: number | string;
  }>(
    `SELECT p.id,p.code,p.slug,p.title,p.description,p.access,p.estimated_minutes,
            p.section_id,s.code AS section_code,s.name AS section_name,
            p.domain_id,d.name AS domain_name,d.description AS domain_description,
            count(v.id) AS question_count,
            count(v.id) FILTER (WHERE v.difficulty='BASIC') AS basic_count,
            count(v.id) FILTER (WHERE v.difficulty='MEDIUM') AS medium_count,
            count(v.id) FILTER (WHERE v.difficulty='HARD') AS hard_count
     FROM public.practice_packages p
     JOIN public.exam_sections s ON s.id=p.section_id
     JOIN public.domains d ON d.id=p.domain_id
     LEFT JOIN public.practice_package_questions pq ON pq.practice_package_id=p.id
     LEFT JOIN public.question_versions v ON v.id=pq.question_version_id AND v.status='PUBLISHED'
     WHERE p.status='PUBLISHED'
     GROUP BY p.id,p.code,p.slug,p.title,p.description,p.access,p.estimated_minutes,
              p.section_id,s.code,s.name,p.domain_id,d.name,d.description,p.sort_order
     ORDER BY p.sort_order,p.title`,
  );

  return result.rows.map((row) => ({
    id: row.id,
    code: row.code,
    slug: row.slug,
    title: row.title,
    description: row.description,
    access: row.access,
    estimatedMinutes: Number(row.estimated_minutes),
    section: {
      id: row.section_id,
      code: row.section_code,
      name: row.section_name,
    },
    domain: {
      id: row.domain_id,
      name: row.domain_name,
      description: row.domain_description || "",
    },
    questionCount: Number(row.question_count),
    difficulty: {
      basic: Number(row.basic_count),
      medium: Number(row.medium_count),
      hard: Number(row.hard_count),
    },
  }));
}

export async function listPracticePackages(): Promise<PracticePackageCard[]> {
  return onlineBackend() ? hostedPackages() : localPackages();
}

async function domainForSubtopic(target: string): Promise<string | null> {
  if (onlineBackend()) {
    const { data } = await hostedDb()
      .from("subtopics")
      .select("topics(domain_id)")
      .eq("id", target)
      .maybeSingle();
    const topic = data?.topics as unknown as { domain_id?: string } | null;
    return topic?.domain_id || null;
  }

  const db = await localContentDatabase();
  if (!db) return null;
  const result = await db.query<{ domain_id: string }>(
    `SELECT t.domain_id
     FROM public.subtopics st
     JOIN public.topics t ON t.id=st.topic_id
     WHERE st.id=$1
     LIMIT 1`,
    [target],
  );
  return result.rows[0]?.domain_id || null;
}

async function packageVersionIds(packageId: string) {
  if (onlineBackend()) {
    const { data, error } = await hostedDb()
      .from("practice_package_questions")
      .select("sort_order,question_version_id")
      .eq("practice_package_id", packageId)
      .order("sort_order");
    if (error) throw error;
    return (data || []).map((item) => item.question_version_id);
  }

  const db = await localContentDatabase();
  if (!db) return [];
  const result = await db.query<{ question_version_id: string }>(
    `SELECT question_version_id
     FROM public.practice_package_questions
     WHERE practice_package_id=$1
     ORDER BY sort_order`,
    [packageId],
  );
  return result.rows.map((item) => item.question_version_id);
}

export async function loadPracticePackage(
  target: string,
): Promise<{ card: PracticePackageCard; questions: Question[] } | null> {
  const cards = await listPracticePackages();
  let card = cards.find(
    (item) =>
      item.access === "FREE" &&
      (item.slug === target || item.domain.id === target),
  );
  if (!card) {
    const domainId = await domainForSubtopic(target);
    if (domainId)
      card = cards.find(
        (item) => item.access === "FREE" && item.domain.id === domainId,
      );
  }
  if (!card) return null;

  const versionIds = await packageVersionIds(card.id);
  const order = new Map(versionIds.map((id, index) => [id, index]));
  const ids = new Set(versionIds);
  const questions = (await publishedQuestions())
    .filter((question) => question.versionId && ids.has(question.versionId))
    .sort(
      (a, b) =>
        (order.get(a.versionId || "") ?? 9999) -
        (order.get(b.versionId || "") ?? 9999),
    );

  if (!questions.length) return null;
  return { card, questions };
}
