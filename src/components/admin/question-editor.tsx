"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminGet, adminPost } from "./api";
import { useAdminRole } from "./shell";
import { QuestionPreview } from "./question-preview";
import {
  blankDraft,
  sourceTypes,
  type Draft,
  type Catalog,
  type QuestionDetail,
  type Media,
} from "@/features/content/model";

const explanationGroups = [
  {
    title: "1. Pahami soalnya",
    hint: "Bantu siswa memahami konteks sebelum menghitung.",
    fields: [
      ["understanding_md", "Apa yang sebenarnya ditanyakan?", true],
      ["known_md", "Diketahui", false],
      ["asked_md", "Ditanyakan", false],
    ],
  },
  {
    title: "2. Pilih strategi",
    hint: "Jelaskan konsep yang relevan dan langkah awal yang paling masuk akal.",
    fields: [
      ["concept_md", "Konsep yang digunakan", true],
      ["first_step_md", "Langkah pertama", true],
    ],
  },
  {
    title: "3. Selesaikan langkah demi langkah",
    hint: "Gunakan Markdown + LaTeX. Pembahasan ini yang akan dibaca siswa.",
    fields: [
      ["solution_md", "Penyelesaian lengkap", true],
      ["final_answer_md", "Jawaban akhir", true],
    ],
  },
  {
    title: "4. Perkaya pembahasan",
    hint: "Opsional, tetapi sangat berguna untuk soal berkualitas tinggi.",
    fields: [
      ["shortcut_md", "Cara cepat / shortcut", false],
      ["common_mistake_md", "Kesalahan umum", false],
      ["option_analysis_md", "Kenapa opsi lain salah", false],
    ],
  },
] as const;

export function QuestionEditor({ id }: { id?: string }) {
  const role = useAdminRole();
  const router = useRouter();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [detail, setDetail] = useState<QuestionDetail | null>(null);
  const [draft, setDraft] = useState<Draft>(blankDraft());
  const [assets, setAssets] = useState<Media[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const apply = (d: QuestionDetail) => {
    setDetail(d);
    const v = d.versions[0];
    setDraft({
      ...blankDraft(),
      ...v,
      code: d.code,
      source_type: d.source_type,
      source_title: v.source?.title || "",
      source_url: v.source?.source_url || "",
      explanation: { ...blankDraft().explanation, ...v.explanation },
      options: ["A", "B", "C", "D", "E"].map(
        (key) =>
          v.options.find((o) => o.option_key === key) || {
            option_key: key,
            content_md: "",
            is_correct: false,
          },
      ),
      version_id: v.id,
      expected_updated_at: v.updated_at,
      media_ids: v.media.map((m) => m.id),
    });
  };

  useEffect(() => {
    Promise.all([
      adminGet<Catalog>("catalog"),
      adminGet<Media[]>("media_list"),
      id ? adminGet<QuestionDetail>("detail", { id }) : Promise.resolve(null),
    ])
      .then(([c, m, d]) => {
        setCatalog(c);
        setAssets(m);
        if (d) apply(d);
        else setDraft(blankDraft(c));
      })
      .catch((e) => setError(e.message));
  }, [id]);

  const version = detail?.versions[0];
  const editable = role === "ADMIN" && (!version || version.status === "DRAFT");
  const field = (key: keyof Draft, value: string) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const act = async (action: string) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (
        ["delete_draft", "archive"].includes(action) &&
        !window.confirm(
          action === "archive"
            ? "Arsipkan soal ini? Versi published tetap immutable."
            : "Hapus draft yang belum dipublikasikan?",
        )
      )
        return;
      const payload =
        action === "create" || action === "save"
          ? {
              ...draft,
              options: draft.options.filter((o) => o.content_md.trim()),
            }
          : { id: detail?.id, version_id: version?.id };
      if (action === "send_qa")
        await adminPost("save", {
          ...draft,
          options: draft.options.filter((o) => o.content_md.trim()),
        });
      const d = await adminPost<
        QuestionDetail & { deleted?: boolean; archived?: boolean }
      >(action, payload);
      if (d.deleted) {
        router.push("/admin/questions");
        router.refresh();
      } else if (d.archived) {
        setNotice("Soal diarsipkan.");
      } else {
        apply(d);
        setNotice(
          action === "publish"
            ? "Soal berhasil dipublikasikan."
            : "Draft tersimpan.",
        );
        if (!id) router.replace(`/admin/questions/${d.id}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan.");
    } finally {
      setBusy(false);
    }
  };

  if (!catalog) return <p role="status">{error || "Memuat editor…"}</p>;

  const topic = catalog.topics.find(
    (t) =>
      t.id ===
      catalog.subtopics.find((s) => s.id === draft.subtopic_id)?.topic_id,
  );
  const domain = catalog.domains.find((d) => d.id === topic?.domain_id);

  return (
    <div className="authoring-page">
      <header className="authoring-head">
        <div>
          <span className="ops-eyebrow">QUESTION AUTHORING</span>
          <h1>{id ? "Edit soal" : "Buat soal baru"}</h1>
          <p>
            {version
              ? `Versi ${version.version_number} · ${version.status}`
              : "Draft baru"}
            {domain?.name ? ` · ${domain.name} / ${topic?.name}` : ""}
          </p>
        </div>
        <div className="authoring-actions">
          {editable && (
            <button
              className="ops-primary"
              disabled={busy}
              onClick={() => act(id ? "save" : "create")}
            >
              Simpan draft
            </button>
          )}
          <a className="ops-secondary" href="#preview">
            Lihat preview
          </a>
          {role === "ADMIN" && version?.status === "DRAFT" && (
            <button disabled={busy} onClick={() => act("send_qa")}>
              Kirim ke QA
            </button>
          )}
          {role === "ADMIN" && version?.status === "QA_PASSED" && (
            <button disabled={busy} onClick={() => act("publish")}>
              Publish
            </button>
          )}
        </div>
      </header>

      {error && (
        <div className="ops-message error" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="ops-message success" role="status">
          {notice}
        </div>
      )}

      <div className="authoring-layout">
        <div className="authoring-form-stack">
          <fieldset disabled={!editable || busy}>
            <section className="authoring-card">
              <div className="authoring-section-head">
                <span>01</span>
                <div>
                  <h2>Klasifikasi soal</h2>
                  <p>
                    Tentukan posisi soal di struktur UTBK dan tingkat
                    kesulitannya.
                  </p>
                </div>
              </div>
              <div className="authoring-grid two">
                <label className="ops-field">
                  Kode soal
                  <input
                    value={draft.code}
                    disabled={!!id}
                    placeholder="Kosongkan untuk dibuat otomatis"
                    onChange={(e) => field("code", e.target.value)}
                  />
                </label>
                <label className="ops-field">
                  Exam / Section
                  <select
                    value={draft.section_id}
                    onChange={(e) => field("section_id", e.target.value)}
                  >
                    {catalog.sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {catalog.exams.find((x) => x.id === s.exam_id)?.code} /{" "}
                        {s.code} — {s.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="ops-field wide">
                  Domain / Topic / Subtopic
                  <select
                    value={draft.subtopic_id}
                    onChange={(e) => field("subtopic_id", e.target.value)}
                  >
                    {catalog.subtopics.map((s) => {
                      const t = catalog.topics.find((x) => x.id === s.topic_id);
                      const d = catalog.domains.find(
                        (x) => x.id === t?.domain_id,
                      );
                      return (
                        <option key={s.id} value={s.id}>
                          {d?.code} / {t?.code} / {s.code} — {s.name}
                        </option>
                      );
                    })}
                  </select>
                </label>
                <label className="ops-field">
                  Difficulty
                  <select
                    value={draft.difficulty}
                    onChange={(e) => field("difficulty", e.target.value)}
                  >
                    {["BASIC", "MEDIUM", "HARD"].map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </label>
                <label className="ops-field">
                  Primary skill
                  <input
                    value={draft.primary_skill || ""}
                    placeholder="Contoh: interpretasi grafik"
                    onChange={(e) => field("primary_skill", e.target.value)}
                  />
                </label>
              </div>
            </section>

            <section className="authoring-card question-compose-card">
              <div className="authoring-section-head">
                <span>02</span>
                <div>
                  <h2>Tulis soal</h2>
                  <p>Kolom inti ada di sini. Markdown dan LaTeX didukung.</p>
                </div>
              </div>
              <label className="ops-field">
                <span>
                  Instruksi <small>opsional</small>
                </span>
                <textarea
                  rows={3}
                  value={draft.instruction_md || ""}
                  placeholder="Contoh: Pilih jawaban yang paling tepat."
                  onChange={(e) => field("instruction_md", e.target.value)}
                />
              </label>
              <label className="ops-field">
                <span>
                  Stimulus <small>opsional</small>
                </span>
                <textarea
                  rows={6}
                  value={draft.stimulus_md || ""}
                  placeholder="Teks, tabel, atau konteks bersama sebelum pertanyaan."
                  onChange={(e) => field("stimulus_md", e.target.value)}
                />
              </label>
              <label className="ops-field">
                <span>
                  Pertanyaan utama <b>wajib</b>
                </span>
                <textarea
                  rows={7}
                  value={draft.stem_md || ""}
                  placeholder={
                    "Tulis soal di sini. Gunakan $...$ atau $$...$$ untuk matematika."
                  }
                  onChange={(e) => field("stem_md", e.target.value)}
                />
              </label>
            </section>

            <section className="authoring-card">
              <div className="authoring-section-head">
                <span>03</span>
                <div>
                  <h2>Opsi & kunci jawaban</h2>
                  <p>Isi opsi A–E lalu pilih satu jawaban benar.</p>
                </div>
              </div>
              <div className="option-editor-list">
                {draft.options.map((o, i) => (
                  <div
                    className={`option-editor-row ${o.is_correct ? "correct" : ""}`}
                    key={o.option_key}
                  >
                    <span className="option-letter">{o.option_key}</span>
                    <textarea
                      aria-label={`Option ${o.option_key}`}
                      rows={3}
                      value={o.content_md}
                      placeholder={`Isi opsi ${o.option_key}`}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          options: d.options.map((item, index) =>
                            index === i
                              ? { ...item, content_md: e.target.value }
                              : item,
                          ),
                        }))
                      }
                    />
                    <label className="correct-choice">
                      <input
                        aria-label={`Correct ${o.option_key}`}
                        type="radio"
                        name="correct"
                        checked={o.is_correct}
                        onChange={() =>
                          setDraft((d) => ({
                            ...d,
                            options: d.options.map((item, index) => ({
                              ...item,
                              is_correct: index === i,
                            })),
                          }))
                        }
                      />{" "}
                      Jawaban benar
                    </label>
                  </div>
                ))}
              </div>
            </section>

            <section className="authoring-card explanation-authoring">
              <div className="authoring-section-head">
                <span>04</span>
                <div>
                  <h2>Pembahasan siswa</h2>
                  <p>
                    Bukan sekadar kunci. Susun reasoning agar siswa paham
                    mengapa jawabannya benar.
                  </p>
                </div>
              </div>
              {explanationGroups.map((group) => (
                <div className="explanation-group" key={group.title}>
                  <h3>{group.title}</h3>
                  <p>{group.hint}</p>
                  <div className="authoring-grid two">
                    {group.fields.map(([key, label, required]) => (
                      <label
                        className={`ops-field ${key === "solution_md" ? "wide" : ""}`}
                        key={key}
                      >
                        <span>
                          {label} {required && <b>wajib</b>}
                        </span>
                        <textarea
                          rows={key === "solution_md" ? 9 : 5}
                          value={draft.explanation[key] || ""}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              explanation: {
                                ...d.explanation,
                                [key]: e.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </section>

            <section className="authoring-card">
              <div className="authoring-section-head">
                <span>05</span>
                <div>
                  <h2>Media & sumber</h2>
                  <p>
                    Lampirkan gambar/diagram dan catat asal konten untuk
                    provenance.
                  </p>
                </div>
              </div>
              <div className="media-picker">
                {assets.length ? (
                  assets.map((m) => (
                    <label key={m.id}>
                      <input
                        type="checkbox"
                        checked={draft.media_ids.includes(m.id)}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            media_ids: e.target.checked
                              ? [...d.media_ids, m.id]
                              : d.media_ids.filter((x) => x !== m.id),
                          }))
                        }
                      />{" "}
                      <span>
                        <strong>{m.original_filename}</strong>
                        <small>
                          {m.kind} · {m.storage_path}
                        </small>
                      </span>
                    </label>
                  ))
                ) : (
                  <p>
                    Belum ada media terdaftar. Tambahkan dari menu Media
                    terlebih dahulu.
                  </p>
                )}
              </div>
              <div className="authoring-grid two source-grid">
                <label className="ops-field">
                  Source type
                  <select
                    value={draft.source_type}
                    onChange={(e) => field("source_type", e.target.value)}
                  >
                    {sourceTypes.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label className="ops-field">
                  Judul sumber
                  <input
                    value={draft.source_title || ""}
                    onChange={(e) => field("source_title", e.target.value)}
                  />
                </label>
                <label className="ops-field">
                  Halaman
                  <input
                    value={draft.source_page || ""}
                    onChange={(e) => field("source_page", e.target.value)}
                  />
                </label>
                <label className="ops-field">
                  URL referensi
                  <input
                    value={draft.source_url || ""}
                    onChange={(e) => field("source_url", e.target.value)}
                  />
                </label>
              </div>
            </section>
          </fieldset>

          {detail && (
            <section className="authoring-card version-card">
              <h2>Riwayat QA & versi</h2>
              {detail.versions.map((v) => (
                <div key={v.id}>
                  <strong>
                    Versi {v.version_number} · {v.status}
                  </strong>
                  {v.reviews.map((r, i) => (
                    <p key={i}>
                      {r.status}: {r.notes || "Tanpa catatan"}
                    </p>
                  ))}
                </div>
              ))}
              {role === "ADMIN" && version?.status === "DRAFT" && (
                <button disabled={busy} onClick={() => act("delete_draft")}>
                  Hapus draft
                </button>
              )}
              {role === "ADMIN" &&
                version &&
                ["PUBLISHED", "QA_PASSED", "ARCHIVED"].includes(
                  version.status,
                ) && (
                  <button disabled={busy} onClick={() => act("revision")}>
                    Buat revisi baru
                  </button>
                )}
              {role === "ADMIN" && (
                <button disabled={busy} onClick={() => act("archive")}>
                  Arsipkan soal
                </button>
              )}
            </section>
          )}
        </div>

        <aside className="authoring-preview" id="preview">
          <div className="sticky-preview">
            <div className="preview-heading">
              <span>LIVE PREVIEW</span>
              <small>Persis seperti konten akan dirender.</small>
            </div>
            <QuestionPreview draft={draft} media={assets} />
          </div>
        </aside>
      </div>
    </div>
  );
}
