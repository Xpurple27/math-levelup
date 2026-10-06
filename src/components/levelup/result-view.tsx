"use client";
import { ArrowRight, ChevronRight } from "lucide-react";
import { topics } from "@/lib/topics";
import { PageHeading } from "./view-ui";
import { kindLabel, topicName } from "./labels";
import type { View, Attempt } from "./types";
import type { Dispatch, SetStateAction } from "react";
type Props = {
  attempt: Attempt;
  resultTab: string;
  setResultTab: Dispatch<SetStateAction<string>>;
  setTopic: Dispatch<SetStateAction<string>>;
  go: (v: View) => void;
  recommended: string;
};
export function ResultView({
  attempt,
  resultTab,
  setResultTab,
  setTopic,
  go,
  recommended,
}: Props) {
  if (!attempt.result) return null;
  return (
    <>
      <PageHeading
        eyebrow="LANGKAH PERTAMA SUDAH TERLEWATI"
        title={
          attempt.kind === "diagnostic"
            ? "Profil kemampuan awalmu"
            : attempt.kind === "tryout"
              ? `Hasil ${topicName(attempt.topic)}`
              : "Satu langkah maju. Kerja bagus!"
        }
        subtitle={
          attempt.kind === "diagnostic"
            ? "Ini titik awal, bukan kesimpulan mutlak. Gunakan hasilnya untuk memilih langkah belajar berikutnya."
            : "Nilai sesi dan bukti mastery adalah dua ukuran berbeda."
        }
      />
      {attempt.kind === "tryout" && (
        <div className="tag-row" role="tablist" aria-label="Hasil paket">
          {[
            ["result", "Hasil"],
            ["analysis", "Analisis"],
            ["solutions", "Pembahasan"],
          ].map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={resultTab === id}
              className={`button ${resultTab === id ? "primary" : "secondary"}`}
              onClick={() => setResultTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {(attempt.kind !== "tryout" || resultTab === "result") && (
        <section className="result-summary panel">
          <div className="score-circle">
            <strong>
              {attempt.result.score}
              <small>%</small>
            </strong>
            <span>Akurasi sesi</span>
          </div>
          <div>
            <span className="eyebrow purple-text">
              {kindLabel[attempt.kind]}
            </span>
            <h2>
              {attempt.kind === "mini"
                ? attempt.result.score >= 80
                  ? "Lulus mini assessment"
                  : "Masih ada konsep untuk diperkuat"
                : "Sekarang kamu tahu langkah berikutnya."}
            </h2>
            <div className="result-counts">
              <span>
                <strong>{attempt.result.correct}</strong>Benar
              </span>
              <span>
                <strong>{attempt.result.incorrect}</strong>Salah
              </span>
              <span>
                <strong>{attempt.result.unanswered}</strong>Belum dijawab
              </span>
            </div>
            <p className="muted small-text">
              {attempt.kind === "mini"
                ? "Lulus ≥80% tidak otomatis berarti Mastered."
                : "Skor ini bukan estimasi skor UTBK. Mastery memakai bobot kesulitan dan confidence."}
            </p>
          </div>
        </section>
      )}
      {(attempt.kind !== "tryout" || resultTab === "analysis") && (
        <div className="result-topics">
          {topics
            .filter((t) => attempt.questions.some((q) => q.topic === t.id))
            .map((t) => {
              const qs = attempt.questions.filter((q) => q.topic === t.id),
                c = qs.filter(
                  (q) => attempt.answers[q.id] === q.correct,
                ).length;
              return (
                <div className="panel" key={t.id}>
                  <span className="tag">
                    {c / qs.length >= 0.8 ? "Kekuatan awal" : "Perlu diperkuat"}
                  </span>
                  <h3>{t.name}</h3>
                  <p>
                    {c} dari {qs.length} soal benar
                  </p>
                  <button
                    className="text-button purple-text"
                    onClick={() => {
                      setTopic(t.id);
                      go("learn");
                    }}
                  >
                    Pelajari konsep <ArrowRight size={15} />
                  </button>
                </div>
              );
            })}
        </div>
      )}
      <div className="result-actions">
        <button
          className="button primary"
          onClick={() => {
            setTopic(
              attempt.kind === "tryout"
                ? recommended
                : attempt.topic || recommended,
            );
            go("learn");
          }}
        >
          Lanjut belajar <ArrowRight size={17} />
        </button>
        <button className="button secondary" onClick={() => go("progress")}>
          Lihat progres
        </button>
      </div>
      {(attempt.kind !== "tryout" || resultTab === "solutions") && (
        <section className="panel solutions">
          <h2>Pembahasan lengkap</h2>
          {attempt.questions.map((item, i) => (
            <details key={item.id}>
              <summary>
                <span
                  className={
                    attempt.answers[item.id] === item.correct
                      ? "solution-correct"
                      : "solution-wrong"
                  }
                >
                  {attempt.answers[item.id] === undefined
                    ? "—"
                    : attempt.answers[item.id] === item.correct
                      ? "✓"
                      : "×"}
                </span>
                Soal {i + 1} · {topicName(item.topic)}
                <ChevronRight size={17} />
              </summary>
              <h3>{item.stem}</h3>
              <p>
                Jawabanmu:{" "}
                {attempt.answers[item.id] === undefined
                  ? "Tidak dijawab"
                  : item.options[attempt.answers[item.id]]}{" "}
                · Jawaban benar: {item.options[item.correct!]}
              </p>
              <strong>Langkah pertama</strong>
              <p>{item.explanation?.firstStep}</p>
              <strong>Penyelesaian</strong>
              <p>{item.explanation?.solution}</p>
              <p className="muted">
                Kesalahan umum: {item.explanation?.mistake}
              </p>
            </details>
          ))}
        </section>
      )}
    </>
  );
}
