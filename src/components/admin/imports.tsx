"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { adminGet } from "./api";
import type { Catalog, Draft } from "@/features/content/model";
import { QuestionPreview } from "./question-preview";

type Job = {
  id: string;
  file_name: string;
  status: string;
  summary_json: {
    total?: number;
    valid?: number;
    invalid?: number;
    skipped?: number;
    warnings?: number;
    source_format?: string;
    error?: string;
  };
  rows?: {
    row_number: number;
    status: string;
    error_message: string | null;
    question_id: string | null;
    parsed_json: Draft | null;
    raw_json?: Record<string, string>;
  }[];
};

export function Imports() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Draft | null>(null);
  const [format, setFormat] = useState<"xlsx" | "docx">("xlsx");
  const [sectionId, setSectionId] = useState("");
  const [subtopicId, setSubtopicId] = useState("");
  const [difficulty, setDifficulty] = useState("MEDIUM");

  const load = () => adminGet<Job[]>("imports").then(setJobs).catch((e) => setError(e.message));
  useEffect(() => {
    void load();
    adminGet<Catalog>("catalog")
      .then((c) => {
        setCatalog(c);
        setSectionId(c.sections[0]?.id || "");
        setSubtopicId(c.subtopics[0]?.id || "");
      })
      .catch((e) => setError(e.message));
  }, []);

  const selectedSubtopic = useMemo(() => catalog?.subtopics.find((s) => s.id === subtopicId), [catalog, subtopicId]);
  const selectedTopic = useMemo(() => catalog?.topics.find((t) => t.id === selectedSubtopic?.topic_id), [catalog, selectedSubtopic]);
  const selectedDomain = useMemo(() => catalog?.domains.find((d) => d.id === selectedTopic?.domain_id), [catalog, selectedTopic]);

  const open = async (id: string) => {
    setJob(await adminGet<Job>("import_detail", { id }));
    setPreview(null);
  };

  const upload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    form.set("section_id", sectionId);
    form.set("subtopic_id", subtopicId);
    form.set("difficulty", difficulty);
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/admin/imports", { method: "POST", body: form });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      await open(d.data.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload gagal.");
      await load();
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!job || !window.confirm("Buat DRAFT untuk semua baris valid? Tidak ada auto-publish.")) return;
    setBusy(true);
    try {
      const r = await fetch("/api/admin/imports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", id: job.id }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      await open(job.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import gagal.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ops-content-page import-page">
      <header className="ops-page-head">
        <div>
          <span className="ops-eyebrow">CONTENT INGESTION</span>
          <h1>Imports</h1>
          <p>Ubah file soal menjadi draft terstruktur. Import tidak pernah langsung publish.</p>
        </div>
      </header>

      <section className="import-format-grid">
        <button className={`import-format-card ${format === "xlsx" ? "active" : ""}`} onClick={() => setFormat("xlsx")} type="button">
          <span className="format-badge">READY</span>
          <h2>Excel / XLSX</h2>
          <p>Terbaik untuk bank soal massal yang sudah mengikuti template LevelUP.</p>
          <span className="format-link">Pilih format Excel</span>
        </button>
        <button className={`import-format-card ${format === "docx" ? "active" : ""}`} onClick={() => setFormat("docx")} type="button">
          <span className="format-badge">BETA</span>
          <h2>Word / DOCX</h2>
          <p>Untuk paket soal Word yang sudah kamu miliki. Parser membaca soal bernomor, opsi A–E, kunci, dan pembahasan.</p>
          <span className="format-link">Pilih format Word</span>
        </button>
        <article className="import-format-card planned">
          <span className="format-badge">NEXT</span>
          <h2>PDF</h2>
          <p>PDF teks akan masuk setelah DOCX stabil; PDF scan akan memakai OCR-assisted draft review.</p>
        </article>
      </section>

      <section className="data-panel import-uploader">
        <div className="data-panel-head">
          <div>
            <h2>{format === "xlsx" ? "Import Excel" : "Import Word"}</h2>
            <p>{format === "xlsx" ? "Upload → validasi → preview → DRAFT." : "DOCX → deteksi struktur → preview → DRAFT → lengkapi pembahasan → QA."}</p>
          </div>
          {format === "xlsx" && <a className="table-action" href="/templates/levelup-question-import.xlsx" download>Download template XLSX</a>}
        </div>

        {format === "docx" && (
          <div className="docx-format-note">
            <strong>Format yang paling mudah dibaca parser</strong>
            <code>1. Pertanyaan...{`\n`}A. Opsi...{`\n`}B. Opsi...{`\n`}C. Opsi...{`\n`}D. Opsi...{`\n`}E. Opsi...{`\n`}Kunci: C{`\n`}Pembahasan: ...{`\n`}Cara Cepat: ...</code>
            <p>Jika dokumen hanya memiliki “Pembahasan”, soal tetap boleh masuk sebagai DRAFT. Field pembahasan terstruktur yang belum lengkap akan ditandai sebagai warning untuk dilengkapi sebelum QA.</p>
          </div>
        )}

        <form onSubmit={upload} className="upload-box ingestion-form">
          {format === "docx" && catalog && (
            <div className="docx-defaults">
              <label className="ops-field">Section
                <select value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
                  {catalog.sections.map((s) => <option key={s.id} value={s.id}>{catalog.exams.find((x) => x.id === s.exam_id)?.code} / {s.code} — {s.name}</option>)}
                </select>
              </label>
              <label className="ops-field">Subtopik default
                <select value={subtopicId} onChange={(e) => setSubtopicId(e.target.value)}>
                  {catalog.subtopics.map((s) => {
                    const t = catalog.topics.find((x) => x.id === s.topic_id);
                    const d = catalog.domains.find((x) => x.id === t?.domain_id);
                    return <option key={s.id} value={s.id}>{d?.code}/{t?.code}/{s.code} — {s.name}</option>;
                  })}
                </select>
              </label>
              <label className="ops-field">Difficulty default
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                  <option>BASIC</option><option>MEDIUM</option><option>HARD</option>
                </select>
              </label>
              <div className="classification-summary">
                <span>Default classification</span>
                <strong>{selectedDomain?.name || "—"} / {selectedTopic?.name || "—"} / {selectedSubtopic?.name || "—"}</strong>
                <small>Bisa diedit lagi per soal setelah menjadi draft.</small>
              </div>
            </div>
          )}
          <label className="file-drop">
            <strong>Pilih {format === "xlsx" ? "workbook .xlsx" : "dokumen .docx"}</strong>
            <span>{format === "xlsx" ? "Maksimal 200 baris / 2 MB. Formula Excel tidak diterima." : "Maksimal 8 MB dan 200 soal. DOCX scan/gambar-only belum didukung."}</span>
            <input key={format} type="file" name="file" accept={format === "xlsx" ? ".xlsx" : ".docx"} required />
          </label>
          <button className="ops-primary" disabled={busy}>{busy ? "Memproses…" : "Upload & Preview"}</button>
        </form>
      </section>

      {error && <div className="ops-message error" role="alert">{error}</div>}

      {jobs.length > 0 && (
        <section className="data-panel">
          <div className="data-panel-head"><div><h2>Riwayat ingestion</h2><p>Buka job untuk melihat validasi dan warning per soal.</p></div></div>
          <div className="import-job-list">
            {jobs.map((j) => (
              <button key={j.id} onClick={() => open(j.id)}>
                <strong>{j.file_name}</strong>
                <span>{j.summary_json.source_format || (j.file_name.toLowerCase().endsWith(".docx") ? "DOCX" : "XLSX")} · {j.status}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {job && (
        <section className="data-panel import-detail">
          <div className="data-panel-head">
            <div><h2>{job.file_name}</h2><p>{job.summary_json.source_format || "IMPORT"} · {job.status}</p></div>
            <button className="ops-primary" disabled={busy || job.status !== "READY_FOR_REVIEW"} onClick={confirm}>Import valid rows as DRAFT</button>
          </div>
          <div className="import-stats">
            <span><strong>{job.summary_json.total ?? 0}</strong>Total</span>
            <span><strong>{job.summary_json.valid ?? 0}</strong>Valid</span>
            <span><strong>{job.summary_json.invalid ?? 0}</strong>Invalid</span>
            <span><strong>{job.summary_json.warnings ?? 0}</strong>Warnings</span>
          </div>
          {job.summary_json.error && <div className="ops-message error">{job.summary_json.error}</div>}
          <div className="table-scroll">
            <table className="ops-table"><thead><tr><th>#</th><th>Status</th><th>Error / warning</th><th>Preview / result</th></tr></thead><tbody>
              {job.rows?.map((r) => (
                <tr key={r.row_number}>
                  <td>{r.row_number}</td>
                  <td><span className="status-chip">{r.status}</span></td>
                  <td>{r.error_message || r.raw_json?.warnings || "—"}</td>
                  <td>{r.parsed_json && <button className="table-action" onClick={() => setPreview(r.parsed_json)}>Preview</button>}{r.question_id && <Link className="table-action" href={`/admin/questions/${r.question_id}`}>Open draft</Link>}</td>
                </tr>
              ))}
            </tbody></table>
          </div>
        </section>
      )}

      {preview && <section className="data-panel"><div className="data-panel-head"><h2>Preview hasil parsing</h2></div><QuestionPreview draft={preview} /></section>}
    </div>
  );
}
