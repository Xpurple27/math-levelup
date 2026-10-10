"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminGet, adminPost } from "./api";
import { qaFields, type BankRow } from "@/features/content/model";

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
  const [rows, setRows] = useState<BankRow[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [checks, setChecks] = useState<Record<string, Record<string, boolean>>>({});
  const [error, setError] = useState("");
  const [active, setActive] = useState<string | null>(null);

  const load = () =>
    adminGet<BankRow[]>("qa_list")
      .then((data) => {
        setRows(data);
        setActive((current) => current && data.some((q) => q.id === current) ? current : data[0]?.id || null);
      })
      .catch((e) => setError(e.message));

  useEffect(() => { void load(); }, []);

  const review = async (q: BankRow, outcome: string) => {
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
    }
  };

  const current = rows.find((q) => q.id === active) || null;
  const currentChecks = current ? checks[current.id] || {} : {};
  const completed = current ? qaFields.filter((key) => currentChecks[key]).length : 0;

  return (
    <div className="ops-content-page qa-page">
      <header className="ops-page-head">
        <div>
          <span className="ops-eyebrow">QUALITY CONTROL</span>
          <h1>QA Queue</h1>
          <p>Reviewer memeriksa kualitas soal sebelum admin dapat mempublikasikannya.</p>
        </div>
        <div className="queue-counter"><strong>{rows.length}</strong><span>menunggu review</span></div>
      </header>

      {error && <div className="ops-message error" role="alert">{error}</div>}

      {!rows.length && !error ? (
        <div className="empty-state"><strong>Queue kosong.</strong><p>Belum ada versi soal berstatus IN_REVIEW.</p></div>
      ) : (
        <div className="qa-workspace">
          <aside className="qa-list-panel">
            <div className="qa-list-head"><strong>Menunggu review</strong><span>{rows.length} item</span></div>
            <div className="qa-list">
              {rows.map((q) => (
                <button key={q.id} className={q.id === current?.id ? "active" : ""} onClick={() => setActive(q.id)}>
                  <span><strong>{q.code}</strong><small>v{q.version_number} · {q.exam}/{q.section}</small></span>
                  <span className="status-chip">{q.difficulty}</span>
                </button>
              ))}
            </div>
          </aside>

          {current && (
            <section className="qa-review-panel">
              <div className="qa-review-head">
                <div>
                  <span className="ops-eyebrow">{current.exam}/{current.section} · {current.domain}</span>
                  <h2>{current.code} <small>v{current.version_number}</small></h2>
                  <p>{current.topic} / {current.subtopic} · {current.difficulty}</p>
                </div>
                <Link className="ops-secondary" href={`/admin/questions/${current.id}`}>Buka preview lengkap</Link>
              </div>

              <div className="qa-progress"><span><strong>{completed}/{qaFields.length}</strong> pemeriksaan selesai</span><div><i style={{ width: `${(completed / qaFields.length) * 100}%` }} /></div></div>

              <div className="qa-check-grid">
                {qaFields.map((key) => (
                  <label className={currentChecks[key] ? "checked" : ""} key={key}>
                    <input
                      type="checkbox"
                      checked={currentChecks[key] || false}
                      onChange={(e) => setChecks((c) => ({ ...c, [current.id]: { ...c[current.id], [key]: e.target.checked } }))}
                    />
                    <span><strong>{qaLabels[key]}</strong><small>{key === "explanation" ? "Pembahasan mengajar, bukan hanya menyebut kunci." : key === "distractors" ? "Opsi salah masuk akal dan tidak menyesatkan secara buruk." : "Periksa dan centang jika sudah sesuai."}</small></span>
                  </label>
                ))}
              </div>

              <label className="ops-field qa-notes">
                <span>Catatan reviewer</span>
                <textarea rows={6} value={notes[current.id] || ""} placeholder="Tuliskan koreksi konkret bila perlu…" onChange={(e) => setNotes((n) => ({ ...n, [current.id]: e.target.value }))} />
              </label>

              <div className="qa-actions">
                <button className="qa-reject" onClick={() => review(current, "REJECTED")}>Reject</button>
                <button className="qa-change" onClick={() => review(current, "CHANGES_REQUESTED")}>Request changes</button>
                <button className="qa-approve" disabled={completed < qaFields.length} onClick={() => review(current, "APPROVED")}>Approve QA</button>
              </div>
              <p className="qa-policy">Approve tidak otomatis publish. Admin tetap melakukan publish setelah QA passed.</p>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
