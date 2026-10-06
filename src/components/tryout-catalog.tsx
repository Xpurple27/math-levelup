"use client";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { tryoutPackages, findTryoutPackage } from "@/lib/tryout-packages";
import { topics } from "@/lib/topics";
type History = {
  id: string;
  kind: string;
  topic: string | null;
  started: number;
  result: { score: number };
};
export function TryoutCatalog({
  history,
  busy,
  onStart,
  onResult,
}: {
  history: History[];
  busy: boolean;
  onStart: (slug: string) => void;
  onResult: (id: string) => void;
}) {
  const [section, setSection] = useState("All");
  const [selected, setSelected] = useState<string | null>(null);
  const pack = findTryoutPackage(selected);
  const sessions = history.filter(
    (h) => h.kind === "tryout" && h.topic === selected,
  );
  return (
    <>
      <label className="field">
        Bagian paket
        <select
          value={section}
          onChange={(e) => {
            setSection(e.target.value);
            setSelected(null);
          }}
        >
          <option value="All">Semua bagian</option>
          <option value="PK">PK — Pengetahuan Kuantitatif</option>
          <option value="PM">PM — Penalaran Matematika</option>
          <option value="PU">PU — Penalaran Umum</option>
        </select>
      </label>
      <div className="result-topics">
        {tryoutPackages
          .filter((p) => section === "All" || p.section === section)
          .map((p) => (
            <section className="panel" key={p.slug}>
              <span className="tag">Gratis · Beta</span>
              <h2>{p.title}</h2>
              <p>{p.description}</p>
              <div className="tag-row">
                <span>{p.questionCount} soal</span>
                <span>{p.minutes} menit</span>
                <span>Versi {p.revision}</span>
              </div>
              <button
                className="button secondary"
                onClick={() => setSelected(p.slug)}
              >
                Detail {p.title}
                <ArrowRight size={17} />
              </button>
            </section>
          ))}
      </div>
      {pack && (
        <section className="panel" aria-label="Detail paket">
          <span className="eyebrow purple-text">
            DETAIL PAKET · VERSI {pack.revision}
          </span>
          <h2>{pack.title}</h2>
          <p>{pack.description}</p>
          <p>
            Materi:{" "}
            {pack.topics
              .map((id) => topics.find((t) => t.id === id)?.name)
              .join(", ")}
            .
          </p>
          <div className="info-box">
            {pack.questionCount} soal · {pack.minutes} menit. Timer dimulai di
            server. Jawaban disimpan otomatis, sesi dapat dilanjutkan, dan tes
            diselesaikan saat waktu habis. Pembahasan tersedia setelah tes
            selesai.
          </div>
          <p className="muted">
            Paket beta gratis menggunakan bank soal latihan yang sama. Percobaan
            dapat diulang; hasil bersifat nonkompetitif dan belum memiliki
            peringkat atau estimasi skor UTBK.
          </p>
          <button
            className="button primary"
            disabled={busy}
            onClick={() => onStart(pack.slug)}
          >
            Mulai / lanjutkan paket
            <ArrowRight size={17} />
          </button>
          <h3>Riwayat paket terbaru</h3>
          <p className="muted small-text">
            Sesi paket dalam 30 aktivitas terakhir.
          </p>
          {sessions.length ? (
            sessions.map((h) => (
              <p key={h.id}>
                <button
                  className="button secondary"
                  onClick={() => onResult(h.id)}
                >
                  {new Intl.DateTimeFormat("id-ID", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "Asia/Jakarta",
                  }).format(h.started)}{" "}
                  · {h.result.score}% · Lihat hasil
                </button>
              </p>
            ))
          ) : (
            <p className="muted">Belum ada hasil untuk paket ini.</p>
          )}
        </section>
      )}
    </>
  );
}
