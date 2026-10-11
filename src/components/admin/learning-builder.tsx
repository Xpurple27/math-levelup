"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpenText,
  ChevronDown,
  ChevronUp,
  Clock3,
  Eye,
  Image as ImageIcon,
  Link2,
  Plus,
  Save,
  Sparkles,
} from "lucide-react";
import { Markdown } from "@/components/markdown";

const blockTypes = [
  ["HEADING", "Heading"],
  ["TEXT", "Text"],
  ["LATEX", "Formula"],
  ["IMAGE", "Image"],
  ["CALLOUT", "Callout"],
  ["EXAMPLE", "Worked example"],
  ["COMMON_MISTAKE", "Common mistake"],
  ["SUMMARY", "Summary"],
] as const;

const assignmentRoles = [
  ["GUIDED", "Guided practice"],
  ["CHECKPOINT", "Checkpoint"],
  ["MINI_ASSESSMENT", "Mini assessment"],
  ["REINFORCEMENT", "Reinforcement"],
] as const;

type Module = {
  id: string;
  subtopic_id: string;
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
};
type Block = {
  id?: string;
  lesson_id?: string;
  block_type: string;
  sort_order?: number;
  content_json: Record<string, unknown>;
};
type Subtopic = {
  id: string;
  name: string;
  topics?: { name?: string; domains?: { name?: string } | null } | null;
};
type Media = {
  id: string;
  original_filename: string;
  alt_text?: string | null;
  url?: string | null;
};
type Question = {
  id: string;
  code: string;
  version_id: string;
  stem_md: string;
  difficulty: string;
  section: string;
  subtopic: string;
  topic: string;
  domain: string;
};
type Assignment = {
  id?: string;
  lesson_id?: string;
  question_version_id: string;
  role: string;
  sort_order?: number;
};
type Payload = {
  modules: Module[];
  lessons: Lesson[];
  blocks: Block[];
  subtopics: Subtopic[];
  media: Media[];
  questions: Question[];
  assignments: Assignment[];
};

function blockText(block: Block) {
  return String(
    block.content_json.text ||
      block.content_json.latex ||
      block.content_json.url ||
      "",
  );
}

function nextContent(type: string, value: string) {
  if (type === "LATEX") return { latex: value };
  if (type === "IMAGE") return { url: value, alt: "", media_id: "" };
  return { text: value };
}

function LessonBlockPreview({ block }: { block: Block }) {
  const text = blockText(block);
  if (block.block_type === "IMAGE") {
    return text ? (
      <figure className="learning-preview-image">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={text} alt={String(block.content_json.alt || "Media lesson")} />
        {block.content_json.alt ? <figcaption>{String(block.content_json.alt)}</figcaption> : null}
      </figure>
    ) : null;
  }
  if (block.block_type === "LATEX")
    return <Markdown text={`$$${text}$$`} />;
  if (block.block_type === "HEADING") return <h2>{text || "Judul bagian"}</h2>;
  if (block.block_type === "CALLOUT")
    return <aside className="learning-preview-callout"><Markdown text={text} /></aside>;
  if (block.block_type === "EXAMPLE")
    return <section className="learning-preview-example"><span>CONTOH TERBIMBING</span><Markdown text={text} /></section>;
  if (block.block_type === "COMMON_MISTAKE")
    return <section className="learning-preview-mistake"><span>KESALAHAN UMUM</span><Markdown text={text} /></section>;
  if (block.block_type === "SUMMARY")
    return <section className="learning-preview-summary"><span>RANGKUMAN</span><Markdown text={text} /></section>;
  return <Markdown text={text} />;
}

export function LearningBuilder() {
  const [data, setData] = useState<Payload>({
    modules: [],
    lessons: [],
    blocks: [],
    subtopics: [],
    media: [],
    questions: [],
    assignments: [],
  });
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedLesson, setSelectedLesson] = useState("");
  const [draftBlocks, setDraftBlocks] = useState<Block[]>([]);
  const [draftAssignments, setDraftAssignments] = useState<Assignment[]>([]);
  const [questionSearch, setQuestionSearch] = useState("");
  const [questionRole, setQuestionRole] = useState("GUIDED");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [moduleForm, setModuleForm] = useState({
    title: "",
    subtopic_id: "",
    level: "FOUNDATION",
    estimated_minutes: 20,
  });
  const [lessonForm, setLessonForm] = useState({
    title: "",
    estimated_minutes: 10,
  });

  async function load() {
    const response = await fetch("/api/admin/learning", { cache: "no-store" });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error || "Gagal memuat learning.");
    setData(json.data);
    setSelectedModule((current) => current || json.data.modules[0]?.id || "");
  }

  useEffect(() => {
    void load().catch((error: Error) => setMessage(error.message));
  }, []);

  const lessons = useMemo(
    () => data.lessons.filter((lesson) => lesson.module_id === selectedModule),
    [data.lessons, selectedModule],
  );
  const currentLesson = data.lessons.find((lesson) => lesson.id === selectedLesson);
  const currentModule = data.modules.find((module) => module.id === selectedModule);
  const filteredQuestions = useMemo(() => {
    const query = questionSearch.trim().toLowerCase();
    return data.questions
      .filter((question) => {
        if (!query) return true;
        return [
          question.code,
          question.stem_md,
          question.domain,
          question.topic,
          question.subtopic,
          question.section,
        ].some((value) => String(value || "").toLowerCase().includes(query));
      })
      .slice(0, 30);
  }, [data.questions, questionSearch]);

  useEffect(() => {
    if (!selectedModule) return;
    if (!lessons.some((lesson) => lesson.id === selectedLesson))
      setSelectedLesson(lessons[0]?.id || "");
  }, [lessons, selectedLesson, selectedModule]);

  useEffect(() => {
    setDraftBlocks(
      data.blocks
        .filter((block) => block.lesson_id === selectedLesson)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    );
    setDraftAssignments(
      data.assignments
        .filter((item) => item.lesson_id === selectedLesson)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    );
  }, [data.blocks, data.assignments, selectedLesson]);

  async function post(action: string, payload: Record<string, unknown>) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/learning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload }),
      });
      const json = await response.json();
      if (!response.ok)
        throw new Error(json.error || "Perubahan gagal disimpan.");
      return json.data;
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Perubahan gagal disimpan.",
      );
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function createModule() {
    const created = await post("create_module", moduleForm);
    if (!created) return;
    setModuleForm({
      title: "",
      subtopic_id: moduleForm.subtopic_id,
      level: "FOUNDATION",
      estimated_minutes: 20,
    });
    await load();
    setSelectedModule(created.id);
    setMessage("Module berhasil dibuat.");
  }

  async function createLesson() {
    if (!selectedModule) return;
    const created = await post("create_lesson", {
      ...lessonForm,
      module_id: selectedModule,
    });
    if (!created) return;
    setLessonForm({ title: "", estimated_minutes: 10 });
    await load();
    setSelectedLesson(created.id);
    setMessage("Lesson berhasil dibuat.");
  }

  async function saveLesson() {
    if (!selectedLesson) return;
    const savedBlocks = await post("save_blocks", {
      lesson_id: selectedLesson,
      blocks: draftBlocks,
    });
    if (!savedBlocks) return;
    const savedAssignments = await post("save_assignments", {
      lesson_id: selectedLesson,
      assignments: draftAssignments,
    });
    if (!savedAssignments) return;
    await load();
    setMessage("Lesson, media, dan assignment soal berhasil disimpan.");
  }

  function addBlock(type: string) {
    setDraftBlocks((rows) => [
      ...rows,
      { block_type: type, content_json: nextContent(type, "") },
    ]);
  }

  function updateBlock(index: number, value: string) {
    setDraftBlocks((rows) =>
      rows.map((row, i) =>
        i === index
          ? { ...row, content_json: nextContent(row.block_type, value) }
          : row,
      ),
    );
  }

  function selectMedia(index: number, mediaId: string) {
    const media = data.media.find((item) => item.id === mediaId);
    if (!media) return;
    setDraftBlocks((rows) =>
      rows.map((row, i) =>
        i === index
          ? {
              ...row,
              content_json: {
                media_id: media.id,
                url: media.url || "",
                alt: media.alt_text || media.original_filename,
              },
            }
          : row,
      ),
    );
  }

  function move(index: number, direction: -1 | 1) {
    setDraftBlocks((rows) => {
      const target = index + direction;
      if (target < 0 || target >= rows.length) return rows;
      const copy = [...rows];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }

  function remove(index: number) {
    setDraftBlocks((rows) => rows.filter((_, i) => i !== index));
  }

  function addQuestion(question: Question) {
    if (
      draftAssignments.some(
        (item) => item.question_version_id === question.version_id,
      )
    ) {
      setMessage("Soal tersebut sudah ada di lesson ini.");
      return;
    }
    setDraftAssignments((rows) => [
      ...rows,
      { question_version_id: question.version_id, role: questionRole },
    ]);
  }

  function assignmentQuestion(item: Assignment) {
    return data.questions.find(
      (question) => question.version_id === item.question_version_id,
    );
  }

  return (
    <section className="learning-builder-page">
      <div className="ops-content-heading learning-builder-heading">
        <div>
          <span className="ops-eyebrow">LEARNING BUILDER</span>
          <h1>Rakit pembelajaran dari konsep sampai checkpoint.</h1>
          <p>
            Module mengelompokkan perjalanan belajar. Lesson menyusun materi,
            media, dan soal terpublikasi menjadi pengalaman belajar yang utuh.
          </p>
        </div>
        <div className="learning-builder-principle">
          <BookOpenText size={20} />
          <span>
            <strong>Question Bank ≠ Learning</strong>
            <small>
              Soal menjadi bahan; Learning Builder merakit pengalaman belajar.
            </small>
          </span>
        </div>
      </div>

      {message && (
        <div className="learning-builder-message" role="status">
          {message}
        </div>
      )}

      <div className="learning-builder-grid">
        <aside className="learning-builder-column learning-module-column">
          <div className="learning-column-head">
            <div>
              <span>01</span>
              <strong>Modules</strong>
            </div>
            <small>{data.modules.length} module</small>
          </div>
          <div className="learning-create-card">
            <input
              placeholder="Judul module"
              value={moduleForm.title}
              onChange={(e) =>
                setModuleForm({ ...moduleForm, title: e.target.value })
              }
            />
            <select
              value={moduleForm.subtopic_id}
              onChange={(e) =>
                setModuleForm({ ...moduleForm, subtopic_id: e.target.value })
              }
            >
              <option value="">Pilih subtopik</option>
              {data.subtopics.map((subtopic) => (
                <option value={subtopic.id} key={subtopic.id}>
                  {subtopic.topics?.domains?.name
                    ? `${subtopic.topics.domains.name} · `
                    : ""}
                  {subtopic.topics?.name ? `${subtopic.topics.name} · ` : ""}
                  {subtopic.name}
                </option>
              ))}
            </select>
            <div className="learning-inline-fields">
              <select
                value={moduleForm.level}
                onChange={(e) =>
                  setModuleForm({ ...moduleForm, level: e.target.value })
                }
              >
                <option value="FOUNDATION">Foundation</option>
                <option value="STANDARD">Standard</option>
                <option value="ADVANCED">Advanced</option>
              </select>
              <input
                aria-label="Estimasi menit"
                type="number"
                min="1"
                value={moduleForm.estimated_minutes}
                onChange={(e) =>
                  setModuleForm({
                    ...moduleForm,
                    estimated_minutes: Number(e.target.value),
                  })
                }
              />
            </div>
            <button
              className="ops-primary"
              disabled={busy || !moduleForm.title || !moduleForm.subtopic_id}
              onClick={() => void createModule()}
            >
              <Plus size={15} /> Buat module
            </button>
          </div>
          <div className="learning-list">
            {data.modules.map((module) => (
              <button
                key={module.id}
                className={selectedModule === module.id ? "active" : ""}
                onClick={() => setSelectedModule(module.id)}
              >
                <span>
                  <strong>{module.title}</strong>
                  <small>
                    {module.level} · {module.status}
                  </small>
                </span>
                <em>
                  <Clock3 size={12} /> {module.estimated_minutes}m
                </em>
              </button>
            ))}
            {!data.modules.length && (
              <p className="learning-empty">
                Belum ada module. Buat module pertama di atas.
              </p>
            )}
          </div>
        </aside>

        <aside className="learning-builder-column learning-lesson-column">
          <div className="learning-column-head">
            <div>
              <span>02</span>
              <strong>Lessons</strong>
            </div>
            <small>{lessons.length} lesson</small>
          </div>
          {selectedModule ? (
            <>
              <div className="learning-module-context">
                <small>MODULE AKTIF</small>
                <strong>{currentModule?.title}</strong>
              </div>
              <div className="learning-create-card compact">
                <input
                  placeholder="Judul lesson"
                  value={lessonForm.title}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, title: e.target.value })
                  }
                />
                <div className="learning-inline-fields single">
                  <input
                    aria-label="Estimasi lesson"
                    type="number"
                    min="1"
                    value={lessonForm.estimated_minutes}
                    onChange={(e) =>
                      setLessonForm({
                        ...lessonForm,
                        estimated_minutes: Number(e.target.value),
                      })
                    }
                  />
                  <span>menit</span>
                </div>
                <button
                  className="ops-secondary"
                  disabled={busy || !lessonForm.title}
                  onClick={() => void createLesson()}
                >
                  <Plus size={15} /> Tambah lesson
                </button>
              </div>
              <div className="learning-list lesson-list">
                {lessons.map((lesson, index) => (
                  <button
                    key={lesson.id}
                    className={selectedLesson === lesson.id ? "active" : ""}
                    onClick={() => setSelectedLesson(lesson.id)}
                  >
                    <span className="lesson-index">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <strong>{lesson.title}</strong>
                      <small>
                        {lesson.status} · {lesson.estimated_minutes} menit
                      </small>
                    </span>
                  </button>
                ))}
                {!lessons.length && (
                  <p className="learning-empty">
                    Module ini belum punya lesson.
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="learning-empty">
              Pilih atau buat module terlebih dahulu.
            </p>
          )}
        </aside>

        <main className="learning-builder-column learning-block-column">
          <div className="learning-column-head learning-editor-head">
            <div>
              <span>03</span>
              <strong>Lesson composer</strong>
            </div>
            {currentLesson && (
              <div className="learning-editor-actions">
                <button
                  className={mode === "edit" ? "active" : ""}
                  onClick={() => setMode("edit")}
                >
                  Editor
                </button>
                <button
                  className={mode === "preview" ? "active" : ""}
                  onClick={() => setMode("preview")}
                >
                  <Eye size={14} /> Preview siswa
                </button>
                <button
                  className="ops-primary"
                  disabled={busy}
                  onClick={() => void saveLesson()}
                >
                  <Save size={15} /> Simpan lesson
                </button>
              </div>
            )}
          </div>

          {!currentLesson ? (
            <div className="learning-block-placeholder">
              <Sparkles size={24} />
              <h2>Pilih lesson untuk mulai menyusun materi.</h2>
              <p>
                Block membuat lesson fleksibel tanpa mengubah struktur database
                setiap kali format pembelajaran berkembang.
              </p>
            </div>
          ) : mode === "preview" ? (
            <div className="learning-student-preview">
              <header>
                <span>{currentModule?.title}</span>
                <h2>{currentLesson.title}</h2>
                <p>
                  {currentLesson.estimated_minutes} menit · {draftBlocks.length}{" "}
                  bagian · {draftAssignments.length} aktivitas soal
                </p>
              </header>
              <div className="learning-preview-body">
                {draftBlocks.map((block, index) => (
                  <LessonBlockPreview block={block} key={`${index}-${block.block_type}`} />
                ))}
                {!draftBlocks.length && (
                  <p className="learning-empty">Lesson belum memiliki materi.</p>
                )}
                {draftAssignments.length > 0 && (
                  <section className="learning-preview-questions">
                    <span>LATIHAN DALAM LESSON</span>
                    {draftAssignments.map((item, index) => {
                      const question = assignmentQuestion(item);
                      return (
                        <article key={`${item.question_version_id}-${index}`}>
                          <small>{item.role.replaceAll("_", " ")}</small>
                          <strong>{question?.code || "Question"}</strong>
                          <Markdown text={question?.stem_md || ""} />
                        </article>
                      );
                    })}
                  </section>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="learning-lesson-title">
                <small>SEDANG DIEDIT</small>
                <h2>{currentLesson.title}</h2>
                <p>
                  {draftBlocks.length} block · {draftAssignments.length} soal ·{" "}
                  {currentLesson.estimated_minutes} menit
                </p>
              </div>
              <div className="learning-block-toolbar">
                {blockTypes.map(([type, label]) => (
                  <button key={type} onClick={() => addBlock(type)}>
                    + {label}
                  </button>
                ))}
              </div>
              <div className="learning-block-stack">
                {draftBlocks.map((block, index) => (
                  <article
                    className="learning-block-card"
                    key={`${block.id || "new"}-${index}`}
                  >
                    <header>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <strong>
                        {blockTypes.find(([type]) => type === block.block_type)?.[1] ||
                          block.block_type}
                      </strong>
                      <div>
                        <button
                          aria-label="Naik"
                          disabled={index === 0}
                          onClick={() => move(index, -1)}
                        >
                          <ChevronUp size={15} />
                        </button>
                        <button
                          aria-label="Turun"
                          disabled={index === draftBlocks.length - 1}
                          onClick={() => move(index, 1)}
                        >
                          <ChevronDown size={15} />
                        </button>
                        <button className="danger" onClick={() => remove(index)}>
                          Hapus
                        </button>
                      </div>
                    </header>
                    {block.block_type === "LATEX" ? (
                      <textarea
                        rows={4}
                        placeholder="Contoh: x^2 + 2x + 1 = 0"
                        value={blockText(block)}
                        onChange={(e) => updateBlock(index, e.target.value)}
                      />
                    ) : block.block_type === "IMAGE" ? (
                      <div className="learning-media-field">
                        <label>
                          <ImageIcon size={14} /> Pilih dari Media Library
                        </label>
                        <select
                          value={String(block.content_json.media_id || "")}
                          onChange={(e) => selectMedia(index, e.target.value)}
                        >
                          <option value="">Pilih media</option>
                          {data.media.map((item) => (
                            <option value={item.id} key={item.id}>
                              {item.original_filename}
                            </option>
                          ))}
                        </select>
                        {blockText(block) ? (
                          <div className="learning-media-preview">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={blockText(block)}
                              alt={String(block.content_json.alt || "Preview media")}
                            />
                          </div>
                        ) : (
                          <small>
                            Upload dan kelola gambar lebih dulu melalui menu Media.
                          </small>
                        )}
                      </div>
                    ) : (
                      <textarea
                        rows={block.block_type === "HEADING" ? 2 : 5}
                        placeholder="Tulis isi block... Markdown dan LaTeX didukung."
                        value={blockText(block)}
                        onChange={(e) => updateBlock(index, e.target.value)}
                      />
                    )}
                  </article>
                ))}
                {!draftBlocks.length && (
                  <div className="learning-block-placeholder small">
                    <p>
                      Belum ada block. Pilih tipe block di atas untuk mulai
                      menulis lesson.
                    </p>
                  </div>
                )}
              </div>

              <section className="learning-question-linker">
                <div className="learning-question-head">
                  <div>
                    <span>04</span>
                    <strong>Question Bank</strong>
                    <p>
                      Tautkan soal PUBLISHED sebagai guided practice, checkpoint,
                      mini assessment, atau reinforcement.
                    </p>
                  </div>
                  <Link2 size={19} />
                </div>

                <div className="learning-question-controls">
                  <input
                    placeholder="Cari kode, stem, domain, topic..."
                    value={questionSearch}
                    onChange={(e) => setQuestionSearch(e.target.value)}
                  />
                  <select
                    value={questionRole}
                    onChange={(e) => setQuestionRole(e.target.value)}
                  >
                    {assignmentRoles.map(([value, label]) => (
                      <option value={value} key={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="learning-question-results">
                  {filteredQuestions.map((question) => (
                    <article key={question.version_id}>
                      <div>
                        <span>
                          {question.code} · {question.section} · {question.difficulty}
                        </span>
                        <Markdown text={question.stem_md} />
                        <small>
                          {question.domain} › {question.topic} › {question.subtopic}
                        </small>
                      </div>
                      <button onClick={() => addQuestion(question)}>+ Tambah</button>
                    </article>
                  ))}
                  {!data.questions.length && (
                    <p className="learning-empty">
                      Belum ada soal PUBLISHED di Question Bank. Builder tetap bisa
                      disusun; soal dapat ditautkan setelah konten lolos QA.
                    </p>
                  )}
                </div>

                {draftAssignments.length > 0 && (
                  <div className="learning-assignment-list">
                    <strong>Soal dalam lesson</strong>
                    {draftAssignments.map((item, index) => {
                      const question = assignmentQuestion(item);
                      return (
                        <div key={`${item.question_version_id}-${index}`}>
                          <span>
                            <b>{String(index + 1).padStart(2, "0")}</b>
                            <em>{item.role.replaceAll("_", " ")}</em>
                            <small>{question?.code || item.question_version_id}</small>
                          </span>
                          <button
                            onClick={() =>
                              setDraftAssignments((rows) =>
                                rows.filter((_, i) => i !== index),
                              )
                            }
                          >
                            Hapus
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </section>
  );
}
