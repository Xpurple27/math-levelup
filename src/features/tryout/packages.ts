import "server-only";

import { createClient } from "@supabase/supabase-js";
import { localContentDatabase } from "@/features/content/db";
import { publishedQuestions } from "@/features/content/runtime";
import { onlineBackend } from "@/lib/backend";
import { resolveQuestionSet } from "@/lib/content-readiness";
import type { Question } from "@/lib/content";

function hostedDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Tryout database belum dikonfigurasi.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
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

async function hostedPackages(): Promise<TryoutPackageCard[]> {
  const { data, error } = await hostedDb()
    .from("tryout_packages")
    .select(
      "id,code,slug,suite_code,suite_title,title,description,access,question_count,duration_seconds,section_order,sort_order,section_id,exam_sections(id,code,name),tryout_package_questions(id)",
    )
    .eq("status", "PUBLISHED")
    .order("sort_order");
  if (error) throw error;

  return (data || []).flatMap((row) => {
    const section = row.exam_sections as unknown as {
      id: string;
      code: string;
      name: string;
    } | null;
    const actual = Array.isArray(row.tryout_package_questions)
      ? row.tryout_package_questions.length
      : 0;
    if (!section || actual !== row.question_count) return [];
    return [
      {
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
      } satisfies TryoutPackageCard,
    ];
  });
}

async function localPackages(): Promise<TryoutPackageCard[]> {
  const db = await localContentDatabase();
  if (!db) return [];
  const result = await db.query<{
    id: string;
    code: string;
    slug: string;
    suite_code: string;
    suite_title: string;
    title: string;
    description: string;
    access: "FREE" | "PREMIUM";
    question_count: number;
    duration_seconds: number;
    section_order: number;
    section_id: string;
    section_code: string;
    section_name: string;
    actual_count: number | string;
  }>(
    `SELECT p.id,p.code,p.slug,p.suite_code,p.suite_title,p.title,p.description,p.access,
            p.question_count,p.duration_seconds,p.section_order,p.section_id,
            s.code AS section_code,s.name AS section_name,count(pq.id) AS actual_count
     FROM public.tryout_packages p
     JOIN public.exam_sections s ON s.id=p.section_id
     LEFT JOIN public.tryout_package_questions pq ON pq.tryout_package_id=p.id
     WHERE p.status='PUBLISHED'
     GROUP BY p.id,p.code,p.slug,p.suite_code,p.suite_title,p.title,p.description,p.access,
              p.question_count,p.duration_seconds,p.section_order,p.section_id,s.code,s.name,p.sort_order
     ORDER BY p.sort_order,p.suite_code,p.section_order`,
  );

  return result.rows.flatMap((row) => {
    if (Number(row.actual_count) !== Number(row.question_count)) return [];
    return [
      {
        id: row.id,
        code: row.code,
        slug: row.slug,
        suiteCode: row.suite_code,
        suiteTitle: row.suite_title,
        title: row.title,
        description: row.description,
        access: row.access,
        questionCount: Number(row.question_count),
        durationSeconds: Number(row.duration_seconds),
        sectionOrder: Number(row.section_order),
        section: {
          id: row.section_id,
          code: row.section_code,
          name: row.section_name,
        },
      } satisfies TryoutPackageCard,
    ];
  });
}

export async function listTryoutPackages(): Promise<TryoutPackageCard[]> {
  const [cards, bank] = await Promise.all([
    onlineBackend() ? hostedPackages() : localPackages(),
    publishedQuestions(),
  ]);
  const references = await packageVersionIds(cards.map((card) => card.id));
  return cards.flatMap((card) => {
    const questions = resolveQuestionSet(
      references.get(card.id) || [],
      bank,
      card.section.code,
    );
    if (!questions || questions.length !== card.questionCount) return [];
    return [card];
  });
}

async function packageVersionIds(packageIds: string[]) {
  const grouped = new Map<string, string[]>();
  if (!packageIds.length) return grouped;
  let rows: { package_id: string; question_version_id: string }[];
  if (onlineBackend()) {
    const { data, error } = await hostedDb()
      .from("tryout_package_questions")
      .select("tryout_package_id,sort_order,question_version_id")
      .in("tryout_package_id", packageIds)
      .order("sort_order");
    if (error) throw error;
    rows = (data || []).map((row) => ({
      package_id: row.tryout_package_id,
      question_version_id: row.question_version_id,
    }));
  } else {
    const db = await localContentDatabase();
    if (!db) return grouped;
    rows = (
      await db.query<{ package_id: string; question_version_id: string }>(
        `SELECT tryout_package_id as package_id,question_version_id FROM public.tryout_package_questions
       WHERE tryout_package_id = ANY($1::uuid[]) ORDER BY sort_order`,
        [packageIds],
      )
    ).rows;
  }
  for (const row of rows) {
    const items = grouped.get(row.package_id) || [];
    items.push(row.question_version_id);
    grouped.set(row.package_id, items);
  }
  return grouped;
}

export async function loadTryoutPackage(
  target: string,
): Promise<{ card: TryoutPackageCard; questions: Question[] } | null> {
  const cards = await listTryoutPackages();
  const card = cards.find(
    (item) =>
      item.access === "FREE" && (item.slug === target || item.code === target),
  );
  if (!card) return null;

  const versionIds = (await packageVersionIds([card.id])).get(card.id) || [];
  const questions = resolveQuestionSet(
    versionIds,
    await publishedQuestions(),
    card.section.code,
  );
  if (!questions || questions.length !== card.questionCount) return null;
  return { card, questions };
}
