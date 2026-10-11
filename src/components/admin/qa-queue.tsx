"use client";
import { useEffect, useState } from "react";
import { adminGet, adminPost } from "./api";
import { QuestionPreview } from "./question-preview";
import {
  qaFields,
  type BankRow,
  type QuestionDetail,
  type Version,
} from "@/features/content/model";
const qaLabels: Record<string, string> = {
  math: "Kebenaran matematika",
  key: "Kunci jawaban",
  wording: "Kejelasan bahasa",
  difficulty: "Tingkat kesulitan",
  taxonomy: "Klasifikasi / taxonomy",
  explanation: "Kualitas pembahasan",
  distractors: "Kualitas pengecoh",
};
export function QAQueue() {
  const [rows, setRows] = useState<BankRow[]>([]),
    [detail, setDetail] = useState<QuestionDetail | null>(null),
    [notes, setNotes] = useState<Record<string, string>>({}),
    [checks, setChecks] = useState<Record<string, Record<string, boolean>>>({}),
    [error, setError] = useState(""),
    [active, setActive] = useState<string | null>(null),
    [busy, setBusy] = useState(false);
  const load = () =>
    adminGet<BankRow[]>("qa_list")
      .then((data) => {
        setRows(data);
        setActive((current) =>
          current && data.some((q) => q.id === current)
            ? current
            : data[0]?.id || null,
        );
      })
      .catch((e) => setError(e.message));
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    if (!active) return;
    adminGet<QuestionDetail>("detail", { id: active })
      .then(setDetail)
      .catch((e) => setError(e.message));
  }, [active]);
  const review = async (q: BankRow, outcome: string) => {
    setBusy(true);
    try {
      await adminPost("review", {
        version_id: q.version_id,
        outcome,
        notes: notes[q.id] || "",
        checks: checks[q.id] || {},
      });
      setError("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Review gagal.");
    } finally {
      setBusy(false);
    }
  };
  const current = rows.find((q) => q.id === active) || null,
    currentChecks = current ? checks[current.id] || {} : {},
    completed = current ? qaFields.filter((k) => currentChecks[k]).length : 0,
    reviewed = current
      ? (detail?.versions.find((v) => v.id === current.version_id) as
          Version | undefined)
      : undefined;
  return (
    <div className="ops-content-page qa-page">
      <header className="ops-page-head">
        <div>
          <span className="ops-eyebrow">QUALITY CONTROL</span>
          <h1>QA Queue</h1>
          <p>
            Nilai soal dari konten yang sebenarnya: stem, opsi, kunci, media,
            dan pembahasan.
          </p>
        </div>
        <div className="filter-summary">
          <strong>{rows.length}</strong>
          <span>menunggu review</span>
        </div>
      </header>
      {error && (
        <p className="ops-message error" role="alert">
          {error}
        </p>
      )}
      {!rows.length ? (
        <div className="empty-state">
          <strong>Antrean review kosong.</strong>
          <p>Soal yang dikirim ke QA akan muncul di sini.</p>
        </div>
      ) : (
        <div className="qa-workspace">
          <aside className="qa-queue-list">
            {rows.map((q) => (
              <button
                type="button"
                key={q.id}
                className={q.id === active ? "active" : ""}
                onClick={() => setActive(q.id)}
              >
                <strong>{q.code}</strong>
                <span>
                  {q.section} · {q.difficulty}
                </span>
                <small>
                  {q.domain} / {q.topic} / {q.subtopic}
                </small>
              </button>
            ))}
          </aside>
          {current && (
            <section className="qa-review-desk">
              <div className="qa-content-preview">
                <div className="data-panel-head">
                  <div>
                    <h2>{current.code}</h2>
                    <p>
                      {current.section} · {current.difficulty} ·{" "}
                      {current.subtopic}
                    </p>
                  </div>
                  {reviewed && (
                    <span className="status-chip">
                      {reviewed.question_type.replaceAll("_", " ")}
                    </span>
                  )}
                </div>
                {reviewed ? (
                  <QuestionPreview draft={reviewed} media={reviewed.media} />
                ) : (
                  <p role="status">Memuat isi soal…</p>
                )}
              </div>
              <div className="qa-check-panel">
                <div className="qa-progress-head">
                  <strong>Checklist QA</strong>
                  <span>
                    {completed}/{qaFields.length}
                  </span>
                </div>
                <div className="qa-progress-track">
                  <span
                    style={{ width: `${(completed / qaFields.length) * 100}%` }}
                  />
                </div>
                <div className="qa-checklist">
                  {qaFields.map((key) => (
                    <label key={key}>
                      <input
                        type="checkbox"
                        checked={!!currentChecks[key]}
                        onChange={(e) =>
                          setChecks((all) => ({
                            ...all,
                            [current.id]: {
                              ...(all[current.id] || {}),
                              [key]: e.target.checked,
                            },
                          }))
                        }
                      />
                      {qaLabels[key]}
                    </label>
                  ))}
                </div>
                <label className="ops-field">
                  Catatan reviewer <b>wajib</b>
                  <textarea
                    rows={6}
                    value={notes[current.id] || ""}
                    onChange={(e) =>
                      setNotes((all) => ({
                        ...all,
                        [current.id]: e.target.value,
                      }))
                    }
                  />
                </label>
                <div className="qa-actions">
                  <button
                    disabled={busy}
                    onClick={() => void review(current, "REJECTED")}
                  >
                    Reject
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => void review(current, "CHANGES_REQUESTED")}
                  >
                    Request changes
                  </button>
                  <button
                    className="ops-primary"
                    disabled={
                      busy ||
                      completed !== qaFields.length ||
                      !(notes[current.id] || "").trim()
                    }
                    onClick={() => void review(current, "APPROVED")}
                  >
                    Approve
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
