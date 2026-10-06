"use client";
import {
  BookOpen,
  ChevronRight,
  Flame,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { topics } from "@/lib/topics";
import type { Mastery } from "@/lib/scoring";
import { masteryLabel } from "@/lib/scoring";
import { Stat, PageHeading } from "./view-ui";
import { kindLabel, topicName } from "./labels";
import type { View, Attempt, History } from "./types";
import type { Dispatch, SetStateAction } from "react";
type Props = {
  avg: number | null;
  solved: number;
  streak: number;
  days: string[];
  history: History[];
  mastery: Mastery[];
  start: (kind: string, t?: string) => Promise<void>;
  syncAttempt: (a: Attempt) => void;
  setView: Dispatch<SetStateAction<View>>;
};
export function ProgressView({
  avg,
  solved,
  streak,
  days,
  history,
  mastery,
  start,
  syncAttempt,
  setView,
}: Props) {
  return (
    <>
      <PageHeading
        eyebrow="BUKTI, BUKAN SEKADAR ANGKA"
        title="Lihat sejauh apa kamu melangkah"
        subtitle="Math mastery mengukur konsep. Nilai diagnostik ditampilkan terpisah dari target UTBK."
      />
      <div className="stat-grid">
        <Stat
          icon={<TrendingUp size={21} />}
          label="Math mastery"
          value={avg === null ? "—" : `${avg}%`}
          foot="Rata-rata subtopik yang diukur"
          color="purple"
        />
        <Stat
          icon={<BookOpen size={21} />}
          label="Soal dijawab"
          value={String(solved)}
          foot="Dari sesi yang diselesaikan"
          color="blue"
        />
        <Stat
          icon={<Flame size={21} />}
          label="Streak aktif"
          value={`${streak} hari`}
          foot={`${days.length} hari belajar tercatat`}
          color="orange"
        />
        <Stat
          icon={<CheckCircle2 size={21} />}
          label="Sesi selesai"
          value={String(history.length)}
          foot="Langkah kecil yang terkumpul"
          color="green"
        />
      </div>
      <section className="panel">
        <h2>Peta kemampuanmu</h2>
        <p className="muted">
          Belum diukur berbeda dari nol. Mastered perlu mastery ≥80 serta bukti
          dan confidence yang cukup.
        </p>
        <div className="skill-list">
          {topics.map((t) => {
            const m = mastery.find((m) => m.topic === t.id);
            return (
              <div className="skill-row" key={t.id}>
                <div>
                  <strong>{t.name}</strong>
                  <small>
                    {m
                      ? `${m.count} soal unik terjawab · confidence ${Math.round(m.confidence * 100)}%`
                      : "Mulai diagnostik untuk mengenali kemampuan"}
                  </small>
                </div>
                <div className="skill-track">
                  <span style={{ width: `${m?.value || 0}%` }} />
                </div>
                <strong>{m ? `${m.value}%` : "—"}</strong>
                <span className="tag">{masteryLabel(m)}</span>
              </div>
            );
          })}
        </div>
      </section>
      <section className="panel history-panel">
        <h2>Riwayat belajar</h2>
        {history.length === 0 ? (
          <div className="empty">
            <BookOpen size={30} />
            <h3>Perjalananmu menunggu langkah pertama.</h3>
            <p>
              Selesaikan diagnostik atau latihan untuk mulai mencatat progres.
            </p>
            <button
              className="button primary"
              onClick={() => start("diagnostic")}
            >
              Mulai diagnostik
            </button>
          </div>
        ) : (
          history.map((h) => (
            <button
              className="history-row"
              key={h.id}
              onClick={async () => {
                const r = await fetch(`/api/action?attempt=${h.id}`);
                const d = await r.json();
                if (d.attempt) {
                  syncAttempt(d.attempt);
                  setView("result");
                }
              }}
            >
              <span className="history-icon">
                <CheckCircle2 size={20} />
              </span>
              <div>
                <strong>{kindLabel[h.kind]}</strong>
                <small>
                  {topicName(h.topic)} ·{" "}
                  {new Intl.DateTimeFormat("id-ID", {
                    day: "numeric",
                    month: "short",
                    timeZone: "Asia/Jakarta",
                  }).format(h.started)}
                </small>
              </div>
              <span>
                {h.result.correct}/{h.result.total} benar
              </span>
              <strong>{h.result.score}%</strong>
              <ChevronRight size={17} />
            </button>
          ))
        )}
      </section>
    </>
  );
}
