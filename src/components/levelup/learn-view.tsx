"use client";
import { ArrowRight, BookOpen, Target, Zap, CheckCircle2 } from "lucide-react";
import { topics } from "@/lib/topics";
import { PageHeading } from "./view-ui";
import type { Topic } from "./types";
import type { Dispatch, SetStateAction } from "react";
type Props = {
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  topic: string;
  setTopic: Dispatch<SetStateAction<string>>;
  currentTopic: Topic;
  busy: boolean;
  start: (kind: string, t?: string) => Promise<void>;
};
const learningTopics = topics.filter(
  (t) =>
    process.env.NEXT_PUBLIC_LEVELUP_PILOT_MODE !== "1" ||
    ["rasio", "aljabar", "persen"].includes(t.id),
);
export function LearnView({
  search,
  setSearch,
  topic,
  setTopic,
  currentTopic,
  busy,
  start,
}: Props) {
  return (
    <>
      <PageHeading
        eyebrow="PAHAMI, BUKAN HAFALKAN"
        title="Belajar dengan arah"
        subtitle={
          process.env.NEXT_PUBLIC_LEVELUP_PILOT_MODE === "1"
            ? "Pilot: rasio, persamaan linear, dan persen. Pelajari konsep, contoh, lalu latihan."
            : "7 modul belajar · 252 soal. Pilih konsep, pahami langkahnya, lalu buktikan pemahamanmu."
        }
      />
      <label className="field lesson-search">
        Cari materi
        <input
          type="search"
          placeholder="Nama materi, domain, atau PK/PM/PU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      <div className="topic-tabs">
        {learningTopics
          .filter(
            (t) =>
              process.env.NEXT_PUBLIC_LEVELUP_PILOT_MODE !== "1" ||
              ["rasio", "aljabar", "persen"].includes(t.id),
          )
          .filter((t) =>
            `${t.name} ${t.domain} ${t.section}`
              .toLowerCase()
              .includes(search.toLowerCase().trim()),
          )
          .map((t) => (
            <button
              className={topic === t.id ? "selected" : ""}
              onClick={() => setTopic(t.id)}
              key={t.id}
            >
              {t.name}
            </button>
          ))}
      </div>
      {!learningTopics.some((t) =>
        `${t.name} ${t.domain} ${t.section}`
          .toLowerCase()
          .includes(search.toLowerCase().trim()),
      ) && (
        <p className="info-box">
          Materi belum ditemukan. Coba kata kunci lain.
        </p>
      )}
      <div className="learning-grid">
        <section className="panel lesson">
          <span className="eyebrow purple-text">
            {currentTopic.domain} · FOUNDATION
          </span>
          <h2>{currentTopic.name}</h2>
          <p>{currentTopic.concept}</p>
          <div className="lesson-block">
            <h3>
              <Target size={18} />
              Cara Mengenali Soal
            </h3>
            <p>{currentTopic.recognize}</p>
          </div>
          <div className="lesson-block first-step">
            <h3>
              <Zap size={18} />
              Langkah Pertama
            </h3>
            <p>{currentTopic.firstStep}</p>
          </div>
          <h3>Contoh yang dikerjakan</h3>
          <div className="worked">
            <strong>{currentTopic.example}</strong>
            <p>{currentTopic.solution}</p>
          </div>
          <h3>Kesalahan umum</h3>
          <p>{currentTopic.mistake}</p>
          <div className="review">
            <CheckCircle2 size={20} />
            <p>
              <strong>Quick review</strong>
              <br />
              Kenali hubungan → tulis model → hitung → periksa satuan.
            </p>
          </div>
        </section>
        <aside>
          <div className="panel lesson-sidebar">
            <BookOpen className="purple-text" size={28} />
            <h3>Ubah paham jadi mampu.</h3>
            <p>
              6 soal terbimbing: 2 Basic, 2 Medium, dan 2 Hard. Jika salah,
              gunakan petunjuk dan coba sekali lagi.
            </p>
            <button
              className="button primary"
              disabled={busy}
              onClick={() => start("guided")}
            >
              Latihan terbimbing <ArrowRight size={17} />
            </button>
            <hr />
            <h3>Mini assessment</h3>
            <p>
              5 soal · 10 menit · tanpa petunjuk. Lulus ≥80%, namun mastery
              tetap memerlukan bukti yang cukup.
            </p>
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => start("mini")}
            >
              Uji pemahaman <ArrowRight size={17} />
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
