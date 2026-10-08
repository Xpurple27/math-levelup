"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { adminGet, adminPost } from "./api";
import { qaFields, type BankRow } from "@/features/content/model";
export function QAQueue() {
  const [rows, setRows] = useState<BankRow[]>([]),
    [notes, setNotes] = useState<Record<string, string>>({}),
    [checks, setChecks] = useState<Record<string, Record<string, boolean>>>({}),
    [error, setError] = useState("");
  const load = () =>
    adminGet<BankRow[]>("qa_list")
      .then(setRows)
      .catch((e) => setError(e.message));
  useEffect(() => {
    void load();
  }, []);
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
  return (
    <>
      <h1>QA Queue</h1>
      <p>
        Reviewer harus berbeda dari pembuat/editor terakhir. Approve tidak
        otomatis publish.
      </p>
      <p role="alert">{error}</p>
      {rows.map((q) => (
        <section className="panel" key={q.id}>
          <h2>
            {q.code} · v{q.version_number}
          </h2>
          <Link href={`/admin/questions/${q.id}`}>Open preview</Link>
          {qaFields.map((key) => (
            <label key={key}>
              <input
                type="checkbox"
                checked={checks[q.id]?.[key] || false}
                onChange={(e) =>
                  setChecks((c) => ({
                    ...c,
                    [q.id]: { ...c[q.id], [key]: e.target.checked },
                  }))
                }
              />
              {key}
            </label>
          ))}
          <label>
            Review notes
            <textarea
              value={notes[q.id] || ""}
              onChange={(e) =>
                setNotes((n) => ({ ...n, [q.id]: e.target.value }))
              }
            />
          </label>
          <div className="tag-row">
            <button onClick={() => review(q, "APPROVED")}>Approve</button>
            <button onClick={() => review(q, "CHANGES_REQUESTED")}>
              Request Changes
            </button>
            <button onClick={() => review(q, "REJECTED")}>Reject</button>
          </div>
        </section>
      ))}
      {!rows.length && !error && <p>Belum ada versi IN_REVIEW.</p>}
    </>
  );
}
