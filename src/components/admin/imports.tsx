"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminGet } from "./api";
import type { Draft } from "@/features/content/model";
import { QuestionPreview } from "./question-preview";

type Job = {
  id: string;
  file_name: string;
  status: string;
  summary_json: { total?: number; valid?: number; invalid?: number; skipped?: number; error?: string };
  rows?: { row_number: number; status: string; error_message: string | null; question_id: string | null; parsed_json: Draft | null }[];
};

export function Imports() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Draft | null>(null);

  const load = () => adminGet<Job[]>("imports").then(setJobs).catch((e) => setError(e.message));
  useEffect(() => { void load(); }, []);

  const open = async (id: string) => {
    setJob(await adminGet<Job>("import_detail", { id }));
    setPreview(null);
  };

  const upload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
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
          <p>Masukkan bank soal dari file tanpa melewati proses review dan QA.</p>
        </div>
      </header>

      <section className="import-format-grid">
        <article className="import-format-card active">
          <span className="format-badge">READY</span>
          <h2>Excel / XLSX</h2>
          <p>Format paling terstruktur untuk import massal. Setiap baris divalidasi sebelum menjadi draft.</p>
          <a href="/templates/levelup-question-import.xlsx" download>Download template</a>
        </article>
        <article className="import-format-card planned">
          <span className="format-badge">NEXT</span>
          <h2>Word / DOCX</h2>
          <p>Untuk paket soal yang sudah kamu susun di Word. Pipeline nanti akan memecah soal, opsi, gambar, dan pembahasan menjadi draft.</p>
        </article>
        <article className="import-format-card planned">
          <span className="format-badge">LATER</span>
          <h2>PDF</h2>
          <p>Untuk dokumen digital atau scan. PDF tidak akan auto-publish; hasil parsing tetap masuk review manusia.</p>
        </article>
      </section>

      <section className="data-panel import-uploader">
        <div className="data-panel-head"><div><h2>Import Excel sekarang</h2><p>Upload → validasi → preview → konfirmasi → DRAFT → QA → Publish.</p></div></div>
        <form onSubmit={upload} className="upload-box">
          <label className="file-drop">
            <strong>Pilih workbook .xlsx</strong>
            <span>Maksimal 200 baris / 2 MB. Formula tidak diterima.</span>
            <input type="file" name="file" accept=".xlsx" required />
          </label>
          <button className="ops-primary" disabled={busy}>{busy ? "Memproses…" : "Upload & Preview"}</button>
        </form>
        <p className="helper-copy">Baris contoh bertanda <code>example=TRUE</code> dilewati. Ubah menjadi FALSE hanya untuk konten yang benar-benar ingin diimpor.</p>
      </section>

      {error && <div className="ops-message error" role="alert">{error}</div>}

      {jobs.length > 0 && (
        <section className="data-panel">
          <div className="data-panel-head"><div><h2>Riwayat import</h2><p>Buka job untuk melihat hasil validasi per baris.</p></div></div>
          <div className="import-job-list">
            {jobs.map((j) => <button key={j.id} onClick={() => open(j.id)}><strong>{j.file_name}</strong><span>{j.status}</span></button>)}
          </div>
        </section>
      )}

      {job && (
        <section className="data-panel import-detail">
          <div className="data-panel-head">
            <div><h2>{job.file_name}</h2><p>{job.status}</p></div>
            <button className="ops-primary" disabled={busy || job.status !== "READY_FOR_REVIEW"} onClick={confirm}>Import valid rows as DRAFT</button>
          </div>
          <div className="import-stats">
            <span><strong>{job.summary_json.total ?? 0}</strong>Total</span>
            <span><strong>{job.summary_json.valid ?? 0}</strong>Valid</span>
            <span><strong>{job.summary_json.invalid ?? 0}</strong>Invalid</span>
            <span><strong>{job.summary_json.skipped ?? 0}</strong>Skipped</span>
          </div>
          {job.summary_json.error && <div className="ops-message error">{job.summary_json.error}</div>}
          <div className="table-scroll">
            <table className="ops-table"><thead><tr><th>Row</th><th>Status</th><th>Error</th><th>Preview / result</th></tr></thead><tbody>
              {job.rows?.map((r) => <tr key={r.row_number}><td>{r.row_number}</td><td><span className="status-chip">{r.status}</span></td><td>{r.error_message || "—"}</td><td>{r.parsed_json && <button className="table-action" onClick={() => setPreview(r.parsed_json)}>Preview</button>}{r.question_id && <Link className="table-action" href={`/admin/questions/${r.question_id}`}>Open draft</Link>}</td></tr>)}
            </tbody></table>
          </div>
        </section>
      )}

      {preview && <section className="data-panel"><div className="data-panel-head"><h2>Preview hasil parsing</h2></div><QuestionPreview draft={preview} /></section>}
    </div>
  );
}
