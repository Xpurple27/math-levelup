import "server-only";
import { contentRPC, testContentAllowed } from "./db";
import type { Catalog, Media, Option } from "./model";
import type { Question } from "../../lib/content";
import type { Topic } from "../../lib/topics";
export async function publicTopics(): Promise<Topic[]> {
  const c = await contentRPC<Catalog>("levelup_content_catalog"),
    bank = await publishedQuestions();
  return c.subtopics.map((st) => {
    const t = c.topics.find((t) => t.id === st.topic_id),
      d = c.domains.find((d) => d.id === t?.domain_id);
    return {
      id: st.id,
      name: st.name,
      domain: d?.name || "",
      section: "",
      sections: [
        ...new Set(bank.filter((q) => q.topic === st.id).map((q) => q.section)),
      ],
      concept: "",
      recognize: "",
      firstStep: "",
      example: "",
      solution: "",
      mistake: "",
    };
  });
}
export async function publishedQuestions(): Promise<Question[]> {
  const data = await contentRPC<
    {
      id: string;
      version_id: string;
      version: number;
      topic: string;
      section: string;
      difficulty: string;
      instruction?: string;
      stimulus?: string;
      stem: string;
      options: Option[];
      explanation: Record<string, string>;
      media: Media[];
    }[]
  >("levelup_published_questions", { p_test_only: testContentAllowed() });
  return data.map((q) => ({
    id: q.id,
    version: q.version,
    versionId: q.version_id,
    topic: q.topic,
    section: q.section,
    difficulty: (q.difficulty[0] +
      q.difficulty.slice(1).toLowerCase()) as Question["difficulty"],
    instruction: q.instruction,
    stimulus: q.stimulus,
    stem: q.stem,
    options: q.options.map((o) => o.content_md),
    correct: q.options.findIndex((o) => o.is_correct),
    explanation: {
      understanding: q.explanation.understanding_md,
      concept: q.explanation.concept_md,
      known: q.explanation.known_md,
      asked: q.explanation.asked_md,
      firstStep: q.explanation.first_step_md,
      solution: q.explanation.solution_md,
      finalAnswer: q.explanation.final_answer_md,
      shortcut: q.explanation.shortcut_md,
      mistake: q.explanation.common_mistake_md || "",
      optionAnalysis: q.explanation.option_analysis_md,
    },
    hint: q.explanation.first_step_md,
    media: q.media.map((m) => ({
      id: m.id,
      kind: m.kind,
      role: (m as Media & { role: string }).role,
      alt: m.alt_text || m.original_filename,
      url: mediaUrl(m),
    })),
  }));
}
export function mediaUrl(m: Pick<Media, "storage_provider" | "storage_path">) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (
    m.storage_provider !== "SUPABASE" ||
    !url ||
    m.storage_path.includes("..") ||
    m.storage_path.includes("://")
  )
    return "";
  return `${url}/storage/v1/object/public/${m.storage_path.split("/").map(encodeURIComponent).join("/")}`;
}
