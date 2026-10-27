"use client";
import {
  BookOpen,
  ChevronRight,
  Flame,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { useMemo } from "react";
import { useTopics } from "../content-context";
import type { Mastery } from "@/lib/scoring";
import { masteryLabel } from "@/lib/scoring";
import { Stat, PageHeading } from "./view-ui";
import { kindLabel, useTopicName } from "./labels";
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

type DomainMastery = {
  key: string;
  section: string;
  domain: string;
  measured: Mastery | undefined;
  subtopics: number;
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
  const topicName = useTopicName();
  const topics = useTopics();

  const domainMastery = useMemo<DomainMastery[]>(() => {
    const groups = new Map<
      string,
      { section: string; domain: string; topicIds: string[] }
    >();
    for (const topic of topics) {
      const section = topic.section || topic.sections?.[0] || "UTBK";
      const domain = topic.domain || "Lainnya";
      const key = `${section}::${domain}`;
      const group = groups.get(key);
      if (group) group.topicIds.push(topic.id);
      else groups.set(key, { section, domain, topicIds: [topic.id] });
    }

    const order = { PK: 0, PM: 1, PU: 2 } as Record<string, number>;
    return [...groups.entries()]
      .map(([key, group]) => {
        const evidence = group.topicIds
          .map((id) => mastery.find((item) => item.topic === id))
          .filter((item): item is Mastery => Boolean(item && item.count > 0));
        const totalCount = evidence.reduce((sum, item) => sum + item.count, 0);
        const measured = evidence.length
          ? {
              topic: key,
              value: totalCount
                ? Math.round(
                    evidence.reduce(
                      (sum, item) => sum + item.value * item.count,
                      0,
                    ) / totalCount,
                  )
                : Math.round(
                    evidence.reduce((sum, item) => sum + item.value, 0) /
                      evidence.length,
                  ),
              count: totalCount,
              advanced: evidence.reduce((sum, item) => sum + item.advanced, 0),
              confidence: totalCount
                ? evidence.reduce(
                    (sum, item) => sum + item.confidence * item.count,
                    0,
                  ) / totalCount
                : evidence.reduce((sum, item) => sum + item.confidence, 0) /
                  evidence.length,
            }
          : undefined;
        return {
          key,
          section: group.section,
          domain: group.domain,
          measured,
          subtopics: group.topicIds.length,
        };
      })
      .sort(
        (a, b) =>
          (order[a.section] ?? 9) - (order[b.section] ?? 9) ||
          a.domain.localeCompare(b.domain, "id"),
      );
  }, [topics, mastery]);

  return (
    <>
      <PageHeading
        eyebrow="BUKTI, BUKAN SEKADAR ANGKA"
        title="Lihat sejauh apa kamu melangkah"
        subtitle="Mastery dan confidence adalah indikator internal berbasis aturan, bukan ukuran psikometrik atau prediksi skor resmi UTBK."
      />
      <div className="stat-grid">
        <Stat
          icon={<TrendingUp size={21} />}
          label="Math mastery"
          value={avg === null ? "Belum diukur" : `${avg}%`}
          foot="Rata-rata kemampuan yang sudah diukur"
          color="purple"
        />
        <Stat
          icon={<BookOpen size={21} />}
          label="Soal dijawab"
          value={String(solved)}
          foot="Termasuk pengulangan dalam 30 sesi terakhir"
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
          Peta diringkas per materi utama PK, PM, dan PU. Subtopik yang sejenis
          digabung agar progres lebih mudah dibaca.
        </p>
        <div className="skill-list">
          {domainMastery.map((item) => {
            const m = item.measured;
            return (
              <div className="skill-row" key={item.key}>
                <div>
                  <strong>
                    {item.section} · {item.domain}
                  </strong>
                  <small>
                    {m
                      ? `${m.count} soal unik terjawab · ${item.subtopics} subtopik tergabung`
                      : `${item.subtopics} subtopik · belum diukur`}
                  </small>
                </div>
                <div className="skill-track">
                  <span style={{ width: `${m?.value || 0}%` }} />
                </div>
                <strong>{m ? `${m.value}%` : "Belum diukur"}</strong>
                <span className="tag">{masteryLabel(m)}</span>
              </div>
            );
          })}
        </div>
      </section>
      <section className="panel">
        <h2>Bukti per keterampilan</h2>
        {mastery
          .filter((m) => m.count > 0)
          .map((m) => (
            <div className="skill-row" key={m.topic}>
              <div>
                <strong>{topicName(m.topic)}</strong>
                <small>
                  {m.count} soal unik terjawab · kecukupan bukti{" "}
                  {Math.round(m.confidence * 100)}%
                  {m.confidence < 0.7 ? " · perlu bukti tambahan" : ""}
                </small>
              </div>
              <strong>{m.value}% mastery</strong>
            </div>
          ))}
        {!mastery.some((m) => m.count > 0) && (
          <p>Belum ada jawaban yang cukup untuk membaca profil kemampuan.</p>
        )}
        <details>
          <summary>Cara membaca indikator</summary>
          <p>
            Skor sesi = jawaban benar ÷ seluruh soal × 100. Jawaban kosong tetap
            dihitung dalam penyebut skor; sesi tanpa jawaban tidak memperbarui
            mastery.
          </p>
          <p>
            Bukti sesi berbobot kesulitan: Basic 1, Medium 1,5, Hard 2; jawaban
            kosong memberi kredit 0. Batas bukti 60 jika hanya Basic, 80 jika
            ada Medium, 100 jika ada Hard. Mastery pertama memakai bukti sesi.
            Selanjutnya: (1 − α) × mastery lama + α × bukti sesi, dibulatkan; α
            = bobot sesi × min(1, jumlah soal keterampilan ÷ 5). Bobot
            diagnostic 0,30; guided 0,10; practice 0,20; mini/tryout 0,35.
            Percobaan kedua guided yang benar mendapat kredit 0,5.
          </p>
          <p>
            Confidence = min(1, jumlah bobot soal unik ÷ 20), dengan Basic 0,5,
            Medium 1, Hard 1,5. ID soal yang sama dihitung sekali dengan bobot
            kesulitan tertinggi yang pernah dijawab, termasuk lintas versi. Ini
            kecukupan bukti internal, bukan probabilitas statistik. Mengulang
            soal masih dapat mengubah mastery melalui rumus pembobotan tersebut.
          </p>
        </details>
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
