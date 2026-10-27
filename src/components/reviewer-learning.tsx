"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, XCircle } from "lucide-react";
import { Markdown } from "@/components/markdown";

type Module = {
  id: string;
  code: string;
  title: string;
  description: string;
  level: string;
  status: string;
  estimated_minutes: number;
};
type Lesson = {
  id: string;
  module_id: string;
  title: string;
  description?: string | null;
  status: string;
  estimated_minutes: number;
  sort_order: number;
};
type Block = {
  id: string;
  lesson_id: string;
  block_type: string;
  sort_order: number;
  content_json: Record<string, unknown>;
};
type Assignment = {
  id: string;
  lesson_id: string;
  question_version_id: string;
  role: string;
  sort_order: number;
};
type Question = {
  version_id: string;
  code: string;
  stem_md: string;
  difficulty: string;
  section: string;
  domain: string;
  topic: string;
  subtopic: string;
};
type Payload = {
  modules: Module[];
  lessons: Lesson[];
  blocks: Block[];
  assignments: Assignment[];
  questions: Question[];
};

function blockText(block: Block) {
  return String(
    block.content_json.text ||
      block.content_json.latex ||
      block.content_json.url ||
      "",
  );
}

function BlockPreview({ block }: { block: Block }) {
  const text = blockText(block);
  if (block.block_type === "IMAGE")
    return text ? (
      <figure className="learning-preview-image">
        <img
          src={text}
          alt={String(block.content_json.alt || "Media lesson")}
        />
      </figure>
    ) : null;
  if (block.block_type === "LATEX") return <Markdown text={`$$${text}$$`} />;
  if (block.block_type === "HEADING") return <h3>{text}</h3>;
  if (block.block_type === "CALLOUT")
    return (
      <aside className="learning-preview-callout">
        <Markdown text={text} />
      </aside>
    );
  if (block.block_type === "EXAMPLE")
    return (
      <section className="learning-preview-example">
        <span>CONTOH TERBIMBING</span>
        <Markdown text={text} />
      </section>
    );
  if (block.block_type === "COMMON_MISTAKE")
    return (
      <section className="learning-preview-mistake">
        <span>KESALAHAN UMUM</span>
        <Markdown text={text} />
      </section>
    );
  if (block.block_type === "SUMMARY")
    return (
      <section className="learning-preview-summary">
        <span>RANGKUMAN</span>
        <Markdown text={text} />
      </section>
    );
  return <Markdown text={text} />;
}

export function ReviewerLearning() {
  const [data, setData] = useState<Payload>({
    modules: [],
    lessons: [],
    blocks: [],
    assignments: [],
    questions: [],
  });
  const [open, setOpen] = useState<string>("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/reviewer/learning", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok)
          throw new Error(json.error || "Gagal memuat learning review.");
        if (controller.signal.aborted) return;
        setData(json.data);
        setOpen((current) => current || json.data.modules[0]?.id || "");
      })
      .catch((error: Error) => {
        if (!controller.signal.aborted) setMessage(error.message);
      });
    return () => controller.abort();
  }, []);

  async function decide(moduleId: string, decision: string) {
    setBusy(`${moduleId}:${decision}`);
    setMessage("");
    try {
      const response = await fetch("/api/reviewer/learning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module_id: moduleId,
          decision,
          notes: notes[moduleId] || "",
        }),
      });
      const json = await response.json();
      if (!response.ok)
        throw new Error(json.error || "Keputusan review gagal disimpan.");
      setData(json.data);
      setOpen(json.data.modules[0]?.id || "");
      setMessage(
        decision === "APPROVED"
          ? "Module dan seluruh lesson dinyatakan lolos QA."
          : "Module dikembalikan ke admin sebagai draft.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Keputusan review gagal disimpan.",
      );
    } finally {
      setBusy("");
    }
  }

  const counts = useMemo(
    () => ({ modules: data.modules.length, lessons: data.lessons.length }),
    [data],
  );

  return (
    <section className="reviewer-learning-page">
      <div className="ops-content-heading">
        <div>
          <span className="ops-eyebrow">LEARNING REVIEW</span>
          <h1>Periksa pengalaman belajar sebelum diterbitkan.</h1>
          <p>
            Reviewer memeriksa struktur module, isi setiap lesson, media, dan
            penempatan soal. Approval berlaku untuk module beserta seluruh
            lesson di dalamnya.
          </p>
        </div>
        <div className="reviewer-learning-summary">
          <strong>{counts.modules}</strong>
          <span>module menunggu</span>
          <strong>{counts.lessons}</strong>
          <span>lesson diperiksa</span>
        </div>
      </div>
      {message && (
        <div className="learning-builder-message" role="status">
          {message}
        </div>
      )}
      <div className="reviewer-learning-list">
        {data.modules.map((module) => {
          const lessons = data.lessons.filter(
            (lesson) => lesson.module_id === module.id,
          );
          const expanded = open === module.id;
          return (
            <article key={module.id} className="reviewer-learning-card">
              <button
                className="reviewer-learning-card-head"
                onClick={() => setOpen(expanded ? "" : module.id)}
              >
                <span>
                  <b>{module.code}</b>
                  <strong>{module.title}</strong>
                  <small>
                    {module.level} · {module.estimated_minutes} menit ·{" "}
                    {lessons.length} lesson
                  </small>
                </span>
                {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {expanded && (
                <div className="reviewer-learning-body">
                  {module.description && (
                    <p className="reviewer-learning-description">
                      {module.description}
                    </p>
                  )}
                  {lessons.map((lesson, index) => {
                    const blocks = data.blocks
                      .filter((block) => block.lesson_id === lesson.id)
                      .sort((a, b) => a.sort_order - b.sort_order);
                    const assignments = data.assignments
                      .filter((item) => item.lesson_id === lesson.id)
                      .sort((a, b) => a.sort_order - b.sort_order);
                    return (
                      <section
                        className="reviewer-lesson-review"
                        key={lesson.id}
                      >
                        <header>
                          <span>{String(index + 1).padStart(2, "0")}</span>
                          <div>
                            <strong>{lesson.title}</strong>
                            <small>
                              {lesson.estimated_minutes} menit · {blocks.length}{" "}
                              block · {assignments.length} soal
                            </small>
                          </div>
                        </header>
                        <div className="reviewer-lesson-content">
                          {blocks.map((block) => (
                            <BlockPreview block={block} key={block.id} />
                          ))}
                        </div>
                        {assignments.length > 0 && (
                          <div className="reviewer-learning-questions">
                            <span>SOAL TERKAIT</span>
                            {assignments.map((assignment) => {
                              const q = data.questions.find(
                                (item) =>
                                  item.version_id ===
                                  assignment.question_version_id,
                              );
                              return q ? (
                                <article key={assignment.id}>
                                  <small>
                                    {assignment.role.replaceAll("_", " ")} ·{" "}
                                    {q.code} · {q.section} · {q.difficulty}
                                  </small>
                                  <Markdown text={q.stem_md} />
                                </article>
                              ) : null;
                            })}
                          </div>
                        )}
                      </section>
                    );
                  })}
                  <div className="reviewer-learning-decision">
                    <label>
                      Catatan reviewer
                      <textarea
                        rows={4}
                        placeholder="Catatan wajib bila meminta perubahan atau menolak."
                        value={notes[module.id] || ""}
                        onChange={(event) =>
                          setNotes((current) => ({
                            ...current,
                            [module.id]: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <div>
                      <button
                        className="request"
                        disabled={!!busy}
                        onClick={() =>
                          void decide(module.id, "CHANGES_REQUESTED")
                        }
                      >
                        <XCircle size={15} /> Minta perubahan
                      </button>
                      <button
                        className="reject"
                        disabled={!!busy}
                        onClick={() => void decide(module.id, "REJECTED")}
                      >
                        <XCircle size={15} /> Tolak
                      </button>
                      <button
                        className="approve"
                        disabled={!!busy}
                        onClick={() => void decide(module.id, "APPROVED")}
                      >
                        <CheckCircle2 size={15} /> Approve module
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </article>
          );
        })}
        {!data.modules.length && (
          <div className="learning-block-placeholder small">
            <p>Tidak ada learning module yang menunggu review.</p>
          </div>
        )}
      </div>
    </section>
  );
}
