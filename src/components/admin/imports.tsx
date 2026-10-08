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
  summary_json: {
    total?: number;
    valid?: number;
    invalid?: number;
    skipped?: number;
    error?: string;
  };
  rows?: {
    row_number: number;
    status: string;
    error_message: string | null;
    question_id: string | null;
    parsed_json: Draft | null;
  }[];
};
export function Imports() {
  const [jobs, setJobs] = useState<Job[]>([]),
    [job, setJob] = useState<Job | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [preview, setPreview] = useState<Draft | null>(null);
  const load = () =>
    adminGet<Job[]>("imports")
      .then(setJobs)
      .catch((e) => setError(e.message));
  useEffect(() => {
    void load();
  }, []);
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
      const r = await fetch("/api/admin/imports", {
          method: "POST",
          body: form,
        }),
        d = await r.json();
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
    if (
      !job ||
      !window.confirm(
        "Create DRAFT questions for all valid rows? No automatic publication.",
      )
    )
      return;
    setBusy(true);
    try {
      const r = await fetch("/api/admin/imports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "confirm", id: job.id }),
        }),
        d = await r.json();
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
    <>
      <h1>Excel Import</h1>
      <p>
        Upload → Parse → Validate → Preview → Confirm → DRAFT → QA → Publish.
      </p>
      <a href="/templates/levelup-question-import.xlsx" download>
        Download Excel template
      </a>
      <p>
        Contoh ditandai example=TRUE dan dilewati. Ubah menjadi FALSE hanya
        untuk baris konten Anda. Maksimal 200 baris / 2 MB; formula tidak
        diterima.
      </p>
      <form onSubmit={upload}>
        <label>
          Workbook .xlsx
          <input type="file" name="file" accept=".xlsx" required />
        </label>
        <button disabled={busy}>Upload & Preview</button>
      </form>
      <p role="alert">{error}</p>
      <div className="tag-row">
        {jobs.map((j) => (
          <button key={j.id} onClick={() => open(j.id)}>
            {j.file_name} · {j.status}
          </button>
        ))}
      </div>
      {job && (
        <section className="panel">
          <h2>
            {job.file_name} · {job.status}
          </h2>
          <p>
            Total: {job.summary_json.total ?? 0} · Valid:{" "}
            {job.summary_json.valid ?? 0} · Invalid:{" "}
            {job.summary_json.invalid ?? 0} · Skipped:{" "}
            {job.summary_json.skipped ?? 0}
          </p>
          {job.summary_json.error && <p>{job.summary_json.error}</p>}
          <button
            disabled={busy || job.status !== "READY_FOR_REVIEW"}
            onClick={confirm}
          >
            Confirm Import as DRAFT
          </button>
          <table>
            <thead>
              <tr>
                <th>Row</th>
                <th>Status</th>
                <th>Errors</th>
                <th>Preview / result</th>
              </tr>
            </thead>
            <tbody>
              {job.rows?.map((r) => (
                <tr key={r.row_number}>
                  <td>{r.row_number}</td>
                  <td>{r.status}</td>
                  <td>{r.error_message || "—"}</td>
                  <td>
                    {r.parsed_json && (
                      <button onClick={() => setPreview(r.parsed_json)}>
                        Preview row {r.row_number}
                      </button>
                    )}
                    {r.question_id && (
                      <Link href={`/admin/questions/${r.question_id}`}>
                        Open draft
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
      {preview && <QuestionPreview draft={preview} />}
    </>
  );
}
