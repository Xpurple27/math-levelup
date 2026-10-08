"use client";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import { topics } from "@/lib/topics";
import type { Mastery } from "@/lib/scoring";
import { PageHeading } from "./view-ui";
import { topicName } from "./labels";
import type { Dispatch, SetStateAction } from "react";
type Props = {
  section: string;
  setSection: Dispatch<SetStateAction<string>>;
  topic: string;
  setTopic: Dispatch<SetStateAction<string>>;
  difficulty: string;
  setDifficulty: Dispatch<SetStateAction<string>>;
  count: number;
  setCount: Dispatch<SetStateAction<number>>;
  busy: boolean;
  start: (kind: string, t?: string) => Promise<void>;
  recommended: string;
  weakest: Mastery | undefined;
};
export function PracticeView({
  section,
  setSection,
  topic,
  setTopic,
  difficulty,
  setDifficulty,
  count,
  setCount,
  busy,
  start,
  recommended,
  weakest,
}: Props) {
  return (
    <>
      <PageHeading
        eyebrow="KONSISTEN LEBIH BERARTI"
        title="Satu latihan lebih dekat"
        subtitle="Jawab, pahami pembahasannya, lalu lanjutkan. Tidak ada batas waktu."
      />
      <div className="practice-layout">
        <section className="panel">
          <span className="icon-tile orange">
            <Zap size={25} />
          </span>
          <h2>Rancang latihanmu</h2>
          <p className="muted">
            Pilih bagian, subtopik, kesulitan, dan jumlah soal. Jawaban pertama
            menjadi bukti kemampuanmu.
          </p>
          <label className="field">
            Bagian UTBK
            <select
              value={section}
              onChange={(e) => {
                const v = e.target.value;
                setSection(v);
                if (
                  v !== "All" &&
                  topics.find((t) => t.id === topic)?.section !== v
                )
                  setTopic(topics.find((t) => t.section === v)!.id);
              }}
            >
              <option value="All">Semua bagian</option>
              <option value="PK">PK — Pengetahuan Kuantitatif</option>
              <option value="PM">PM — Penalaran Matematika</option>
              <option
                disabled={process.env.NEXT_PUBLIC_LEVELUP_PILOT_MODE === "1"}
                value="PU"
              >
                PU — Penalaran Umum
              </option>
            </select>
          </label>
          <label className="field">
            Subtopik
            <select value={topic} onChange={(e) => setTopic(e.target.value)}>
              {topics
                .filter(
                  (t) =>
                    process.env.NEXT_PUBLIC_LEVELUP_PILOT_MODE !== "1" ||
                    ["rasio", "aljabar", "persen"].includes(t.id),
                )
                .filter((t) => section === "All" || t.section === section)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} · {t.section}
                  </option>
                ))}
            </select>
          </label>
          <label className="field">
            Tingkat kesulitan
            <select
              value={difficulty}
              onChange={(e) => {
                setDifficulty(e.target.value);
                if (e.target.value !== "Mixed" && count > 10) setCount(10);
              }}
            >
              <option value="Mixed">Campuran</option>
              <option
                disabled={process.env.NEXT_PUBLIC_LEVELUP_PILOT_MODE === "1"}
                value="Basic"
              >
                Basic — fondasi
              </option>
              <option
                disabled={process.env.NEXT_PUBLIC_LEVELUP_PILOT_MODE === "1"}
                value="Medium"
              >
                Medium — penerapan
              </option>
              <option
                disabled={process.env.NEXT_PUBLIC_LEVELUP_PILOT_MODE === "1"}
                value="Hard"
              >
                Hard — lebih menantang
              </option>
            </select>
          </label>
          <label className="field">
            Jumlah soal
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            >
              {(process.env.NEXT_PUBLIC_LEVELUP_PILOT_MODE === "1"
                ? [5]
                : difficulty === "Mixed"
                  ? [5, 10, 15, 20]
                  : [5, 10]
              ).map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <div className="info-box">
            {difficulty === "Mixed"
              ? "Campuran 3 tingkat kesulitan"
              : difficulty}{" "}
            · Soal baru diprioritaskan · Pembahasan setelah menjawab
          </div>
          <button
            className="button primary"
            disabled={busy}
            onClick={() => start("practice")}
          >
            Mulai latihan <ArrowRight size={17} />
          </button>
        </section>
        <section className="panel recommendation">
          <Sparkles size={26} />
          <span className="eyebrow">REKOMENDASI HARI INI</span>
          <h2>{topicName(recommended)}</h2>
          <p>
            {weakest
              ? "Latih subtopik dengan mastery terendah, lalu lihat perubahan progresmu."
              : "Belum ada profil kemampuan. Mulai dari fondasi atau ambil diagnostik terlebih dahulu."}
          </p>
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => start("practice", recommended)}
          >
            Latih topik ini <ArrowRight size={17} />
          </button>
          <div className="small-text muted">
            Minimal 5 jawaban latihan dihitung sebagai hari belajar aktif.
          </div>
        </section>
      </div>
    </>
  );
}
