"use client";
import { useState } from "react";
export function ReportIssue({
  attemptId,
  questionId,
  view,
  topic,
}: {
  attemptId?: string;
  questionId?: string;
  view: string;
  topic?: string;
}) {
  const [open, setOpen] = useState(false),
    [category, setCategory] = useState("question"),
    [message, setMessage] = useState(""),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false),
    [sent, setSent] = useState(false);
  return (
    <div>
      <button
        className="text-button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        {questionId ? "Laporkan masalah soal" : "Kirim masukan halaman"}
      </button>
      {open && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setStatus("");
            try {
              const r = await fetch("/api/action", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "reportIssue",
                  id: attemptId,
                  questionId,
                  category,
                  view,
                  message,
                  topic,
                }),
              });
              const data = await r.json();
              if (!r.ok || data.reported !== true)
                throw new Error(data.error || "Laporan belum tersimpan.");
              setStatus("Laporan tersimpan. Terima kasih.");
              setSent(true);
            } catch (err) {
              setStatus(
                err instanceof Error
                  ? err.message
                  : "Laporan belum tersimpan. Coba lagi.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="field">
            Jenis masalah
            <select
              value={category}
              disabled={busy || sent}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="question">Teks soal / pilihan</option>
              <option value="answer">Kunci jawaban</option>
              <option value="explanation">Pembahasan</option>
              <option value="technical">Gangguan teknis</option>
              <option value="display">Tampilan membingungkan</option>
              <option value="suggestion">Saran lain</option>
            </select>
          </label>
          <label className="field">
            Detail masalah
            <textarea
              required
              maxLength={1000}
              value={message}
              disabled={busy || sent}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>
          <p className="muted small-text">
            Konteks disertakan otomatis. Jangan tulis kata sandi atau data
            pribadi. Timer sesi tetap berjalan.
          </p>
          <button
            className="button secondary"
            disabled={busy || sent || !message.trim()}
          >
            {busy ? "Mengirim…" : "Kirim laporan"}
          </button>
          <p role="status">{status}</p>
        </form>
      )}
    </div>
  );
}
