"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Layers3,
} from "lucide-react";
import { Markdown } from "@/components/markdown";

type Module = {
  id: string;
  subtopic_id: string;
  title: string;
  description: string;
  level: string;
  estimated_minutes: number;
  subtopics?: {
    name?: string;
    topics?: { name?: string; domains?: { name?: string } | null } | null;
  } | null;
};
type Lesson = {
  id: string;
  module_id: string;
  title: string;
  description?: string | null;
  sort_order: number;
  estimated_minutes: number;
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
  role: string;
  sort_order: number;
  question_versions?: {
    id?: string;
    difficulty?: string;
    stem_md?: string;
    question_type?: string;
    questions?: { code?: string } | null;
  } | null;
};
type Payload = {
  modules: Module[];
  lessons: Lesson[];
  blocks: Block[];
  assignments: Assignment[];
};

type Props = {
  targetSubtopicId?: string;
  onPractice?: () => void;
};

function text(block: Block) {
  return String(block.content_json.text || block.content_json.latex || "");
}

function StudentBlock({ block }: { block: Block }) {
  const value = text(block);
  if (block.block_type === "IMAGE") {
    const url = String(block.content_json.url || "");
    if (!url) return null;
    return (
      <figure className="learn-reading-image">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={String(block.content_json.alt || "Media pembelajaran")}
        />
        {block.content_json.alt ? (
          <figcaption>{String(block.content_json.alt)}</figcaption>
        ) : null}
      </figure>
    );
  }
  if (block.block_type === "LATEX")
    return (
      <div className="learn-reading-formula">
        <Markdown text={`$$${value}$$`} />
      </div>
    );
  if (block.block_type === "HEADING")
    return <h2 className="learn-reading-heading">{value}</h2>;
  if (block.block_type === "CALLOUT")
    return (
      <aside className="learn-reading-callout">
        <Markdown text={value} />
      </aside>
    );
  if (block.block_type === "EXAMPLE")
    return (
      <section className="learn-reading-example">
        <span>CONTOH TERBIMBING</span>
        <Markdown text={value} />
      </section>
    );
  if (block.block_type === "COMMON_MISTAKE")
    return (
      <section className="learn-reading-mistake">
        <span>KESALAHAN UMUM</span>
        <Markdown text={value} />
      </section>
    );
  if (block.block_type === "SUMMARY")
    return (
      <section className="learn-reading-summary">
        <span>RANGKUMAN</span>
        <Markdown text={value} />
      </section>
    );
  return (
    <div className="learn-reading-text">
      <Markdown text={value} />
    </div>
  );
}

const roleLabel: Record<string, string> = {
  GUIDED: "Guided practice",
  CHECKPOINT: "Checkpoint",
  MINI_ASSESSMENT: "Mini assessment",
  REINFORCEMENT: "Reinforcement",
};

export function LearnView({ targetSubtopicId, onPractice }: Props) {
  const [data, setData] = useState<Payload>({
    modules: [],
    lessons: [],
    blocks: [],
    assignments: [],
  });
  const [moduleId, setModuleId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/learning", { cache: "no-store" })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok)
          throw new Error(json.error || "Materi belajar gagal dimuat.");
        if (!alive) return;
        setData(json.data);
        const preferred =
          json.data.modules.find(
            (item: Module) => item.subtopic_id === targetSubtopicId,
          ) || json.data.modules[0];
        const firstModule = preferred?.id || "";
        const firstLesson =
          json.data.lessons.find(
            (item: Lesson) => item.module_id === firstModule,
          )?.id || "";
        setModuleId(firstModule);
        setLessonId(firstLesson);
      })
      .catch((reason: Error) => alive && setError(reason.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [targetSubtopicId]);

  const moduleLessons = useMemo(
    () =>
      data.lessons
        .filter((lesson) => lesson.module_id === moduleId)
        .sort((a, b) => a.sort_order - b.sort_order),
    [data.lessons, moduleId],
  );
  const currentModule = data.modules.find((item) => item.id === moduleId);
  const currentLesson =
    moduleLessons.find((item) => item.id === lessonId) || moduleLessons[0];
  const currentIndex = currentLesson
    ? moduleLessons.findIndex((item) => item.id === currentLesson.id)
    : -1;
  const blocks = currentLesson
    ? data.blocks
        .filter((item) => item.lesson_id === currentLesson.id)
        .sort((a, b) => a.sort_order - b.sort_order)
    : [];
  const assignments = currentLesson
    ? data.assignments
        .filter((item) => item.lesson_id === currentLesson.id)
        .sort((a, b) => a.sort_order - b.sort_order)
    : [];

  function chooseModule(id: string) {
    setModuleId(id);
    setLessonId(
      data.lessons
        .filter((lesson) => lesson.module_id === id)
        .sort((a, b) => a.sort_order - b.sort_order)[0]?.id || "",
    );
  }

  if (loading) {
    return (
      <section className="learn-experience">
        <div className="learn-loading">
          <span />
          <span />
          <span />
        </div>
      </section>
    );
  }
  if (error) {
    return (
      <section className="learn-experience">
        <div className="learn-empty-state">
          <BookOpen size={28} />
          <h1>Materi belum dapat dimuat.</h1>
          <p>{error}</p>
        </div>
      </section>
    );
  }
  if (!data.modules.length) {
    return (
      <section className="learn-experience">
        <div className="learn-empty-state">
          <BookOpen size={28} />
          <h1>Belum ada materi yang tersedia.</h1>
          <p>
            Materi yang sudah selesai ditinjau dan dipublikasikan akan muncul di
            sini.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="learn-experience">
      <header className="learn-hero">
        <div>
          <span>LEARNING PATH</span>
          <h1>Belajar konsep, lihat contoh, lalu buktikan pemahamanmu.</h1>
          <p>
            Pilih module berdasarkan topik yang ingin kamu kuasai. Setiap lesson
            disusun berurutan agar belajar tidak lompat-lompat.
          </p>
        </div>
        <div className="learn-hero-stat">
          <Layers3 size={20} />
          <strong>{data.modules.length}</strong>
          <span>module tersedia</span>
        </div>
      </header>

      <div className="learn-layout">
        <aside className="learn-catalog">
          <div className="learn-catalog-title">
            <span>MODULE</span>
            <strong>Pilih jalur belajar</strong>
          </div>
          {data.modules.map((module) => (
            <button
              key={module.id}
              className={moduleId === module.id ? "active" : ""}
              onClick={() => chooseModule(module.id)}
            >
              <span>
                <strong>{module.title}</strong>
                <small>
                  {module.subtopics?.topics?.domains?.name || "Matematika"} ·{" "}
                  {module.subtopics?.topics?.name || module.subtopics?.name || ""}
                </small>
              </span>
              <em>
                <Clock3 size={12} /> {module.estimated_minutes}m
              </em>
            </button>
          ))}
        </aside>

        <aside className="learn-lessons">
          <div className="learn-catalog-title">
            <span>LESSON</span>
            <strong>{currentModule?.title}</strong>
          </div>
          {moduleLessons.map((lesson, index) => (
            <button
              key={lesson.id}
              className={currentLesson?.id === lesson.id ? "active" : ""}
              onClick={() => setLessonId(lesson.id)}
            >
              <span className="learn-lesson-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>
                <strong>{lesson.title}</strong>
                <small>{lesson.estimated_minutes} menit</small>
              </span>
            </button>
          ))}
          {!moduleLessons.length && (
            <p className="learn-sidebar-empty">
              Module ini belum memiliki lesson yang dipublikasikan.
            </p>
          )}
        </aside>

        <main className="learn-reader">
          {!currentLesson ? (
            <div className="learn-empty-state compact">
              <BookOpen size={24} />
              <h2>Pilih lesson untuk mulai belajar.</h2>
            </div>
          ) : (
            <>
              <div className="learn-reader-head">
                <div>
                  <span>
                    LESSON {currentIndex + 1} / {moduleLessons.length}
                  </span>
                  <h2>{currentLesson.title}</h2>
                  {currentLesson.description && (
                    <p>{currentLesson.description}</p>
                  )}
                </div>
                <div className="learn-reader-progress">
                  <span
                    style={{
                      width: `${Math.round(
                        ((currentIndex + 1) /
                          Math.max(moduleLessons.length, 1)) *
                          100,
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <article className="learn-reading-surface">
                {blocks.map((block) => (
                  <StudentBlock block={block} key={block.id} />
                ))}
                {!blocks.length && (
                  <p className="learn-sidebar-empty">Isi lesson belum tersedia.</p>
                )}

                {assignments.length > 0 && (
                  <section className="learn-assignment-zone">
                    <div className="learn-assignment-title">
                      <CheckCircle2 size={18} />
                      <div>
                        <span>UJI PEMAHAMAN</span>
                        <strong>{assignments.length} aktivitas terhubung</strong>
                      </div>
                    </div>
                    {assignments.map((item) => (
                      <article key={item.id} className="learn-assignment-card">
                        <span>{roleLabel[item.role] || item.role}</span>
                        <strong>
                          {item.question_versions?.questions?.code || "Soal"}
                        </strong>
                        <Markdown text={item.question_versions?.stem_md || ""} />
                        <small>
                          {item.question_versions?.difficulty || ""} ·{" "}
                          {item.question_versions?.question_type || ""}
                        </small>
                      </article>
                    ))}
                  </section>
                )}
              </article>

              <nav className="learn-reader-nav" aria-label="Navigasi lesson">
                <button
                  disabled={currentIndex <= 0}
                  onClick={() =>
                    setLessonId(
                      moduleLessons[currentIndex - 1]?.id || currentLesson.id,
                    )
                  }
                >
                  <ArrowLeft size={16} /> Sebelumnya
                </button>
                <span>
                  {currentIndex + 1} dari {moduleLessons.length}
                </span>
                <button
                  disabled={currentIndex >= moduleLessons.length - 1}
                  onClick={() =>
                    setLessonId(
                      moduleLessons[currentIndex + 1]?.id || currentLesson.id,
                    )
                  }
                >
                  Berikutnya <ArrowRight size={16} />
                </button>
              </nav>

              {currentIndex === moduleLessons.length - 1 && onPractice && (
                <section className="mt-5 flex flex-col gap-3 rounded-2xl border border-[#cfeee8] bg-[#f2fcf9] p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#14705f]">
                      NEXT DIRECTION
                    </span>
                    <h3 className="mt-1 text-lg font-extrabold text-[#11182b]">
                      Buktikan konsep ini lewat practice.
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-[#697386]">
                      VECTRA akan membuka domain practice yang paling dekat dengan
                      learning path ini bila paketnya tersedia.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0b1020] px-4 text-sm font-extrabold text-white"
                    onClick={onPractice}
                  >
                    Continue to Practice <ArrowRight size={16} />
                  </button>
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </section>
  );
}
