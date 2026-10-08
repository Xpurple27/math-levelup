export type Role = "STUDENT" | "ADMIN" | "REVIEWER";
export type Taxon = {
  id: string;
  code: string;
  name: string;
  slug?: string;
  exam_id?: string;
  domain_id?: string;
  topic_id?: string;
  status: string;
};
export type Catalog = {
  exams: Taxon[];
  sections: Taxon[];
  domains: Taxon[];
  topics: Taxon[];
  subtopics: Taxon[];
  published_count: number;
};
export const sourceTypes = [
  "ORIGINAL",
  "PAST_EXAM",
  "ADAPTED",
  "PDF",
  "EXCEL",
  "AI_ASSISTED",
  "OTHER",
] as const;
export const explanationFields = [
  ["understanding_md", "Understanding", true],
  ["known_md", "Diketahui", false],
  ["asked_md", "Ditanyakan", false],
  ["concept_md", "Konsep", true],
  ["first_step_md", "Langkah Pertama", true],
  ["solution_md", "Penyelesaian", true],
  ["final_answer_md", "Jawaban Akhir", true],
  ["shortcut_md", "Shortcut", false],
  ["common_mistake_md", "Kesalahan Umum", false],
  ["option_analysis_md", "Analisis Opsi", false],
] as const;
export type Option = {
  option_key: string;
  content_md: string;
  is_correct: boolean;
};
export type Draft = {
  code: string;
  section_id: string;
  subtopic_id: string;
  difficulty: string;
  instruction_md: string;
  stimulus_md: string;
  stem_md: string;
  primary_skill: string;
  options: Option[];
  explanation: Record<string, string>;
  source_type: string;
  source_title: string;
  source_page: string;
  source_url?: string;
  media_ids: string[];
  version_id?: string;
  expected_updated_at?: string;
  source_id?: string;
};
export type Media = {
  url?: string;
  id: string;
  kind: string;
  storage_path: string;
  storage_provider: string;
  original_filename: string;
  mime_type: string;
  alt_text?: string;
  width?: number;
  height?: number;
  file_size: number;
};
export type Version = Draft & {
  source?: { title: string; source_url?: string };
  id: string;
  version_number: number;
  status: string;
  created_at: string;
  updated_at: string;
  source_id?: string;
  media: Media[];
  reviews: { status: string; notes: string; reviewer_id: string }[];
};
export type QuestionDetail = {
  id: string;
  code: string;
  status: string;
  source_type: string;
  versions: Version[];
};
export type BankRow = {
  id: string;
  code: string;
  version_id: string;
  version_number: number;
  status: string;
  section: string;
  exam: string;
  domain: string;
  topic: string;
  subtopic: string;
  difficulty: string;
  source_type: string;
  source_title?: string;
  updated_at: string;
  stem_md: string;
  logical_status: string;
};
export const qaFields = [
  "math",
  "key",
  "wording",
  "difficulty",
  "taxonomy",
  "explanation",
  "distractors",
] as const;
export function blankDraft(c?: Catalog): Draft {
  return {
    code: "",
    section_id: c?.sections[0]?.id || "",
    subtopic_id: c?.subtopics[0]?.id || "",
    difficulty: "BASIC",
    instruction_md: "",
    stimulus_md: "",
    stem_md: "",
    primary_skill: "",
    options: ["A", "B", "C", "D", "E"].map((option_key, i) => ({
      option_key,
      content_md: "",
      is_correct: i === 0,
    })),
    explanation: Object.fromEntries(
      explanationFields.map(([key]) => [key, ""]),
    ),
    source_type: "ORIGINAL",
    source_title: "",
    source_page: "",
    media_ids: [],
  };
}
