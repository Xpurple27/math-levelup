"use client";

import { useEffect, useState } from "react";
import { Explanation } from "../explanation";
import { ContentMedia } from "../content-media";
import { Markdown } from "../markdown";
import { ReportIssue } from "./report-issue";
import { ArrowRight, ChevronRight, Trophy, X } from "lucide-react";
import { useTopics } from "../content-context";
import { PageHeading } from "./view-ui";
import { kindLabel, useTopicName } from "./labels";
import type { View, Attempt } from "./types";
import type { Dispatch, SetStateAction } from "react";

const RUN_KEY = "vectra-mini-tryout-run";
const STATS_KEY = "vectra-mini-tryout-stats";

type SuiteRun = {
  suiteCode: string;
  suiteTitle: string;
  attemptNo: number;
  sectionSlugs: string[];
  sectionCodes: string[];
  currentIndex: number;
  results: Record<string, { correct: number; total: number; score: number }>;
  completed?: boolean;
};

type SuiteSummary = {
  title: string;
  attemptNo: number;
  score: number;
  bestScore: number;
  correct: number;
  total: number;
};

type Props = {
  attempt: Attempt;
  resultTab: string;
  setResultTab: Dispatch<SetStateAction<string>>;
  setTopic: Dispatch<SetStateAction<string>>;
  go: (v: View) => void;
  recommended: string;
  start: (kind: string, topic?: string) => Promise<void>;
};

export function ResultView({
  attempt,
  resultTab,
  setResultTab,
  setTopic,
  go,
  recommended,
  start,
}: Props) {
  const topicName = useTopicName();
  const topics = useTopics();
  const [nextSection, setNextSection] = useState<{ code: string; slug: string } | null>(null);
  const [suiteSummary, setSuiteSummary] = useState<SuiteSummary | null>(null);

  useEffect(() => {
    if (attempt.kind !== "tryout" || !attempt.result || !attempt.topic) return;
    try {
      const raw = localStorage.getItem(RUN_KEY);
      if (!raw) return;
      const run = JSON.parse(raw) as SuiteRun;
      const sectionIndex = run.sectionSlugs.indexOf(attempt.topic);
      if (sectionIndex < 0) return;

      run.results[attempt.topic] = {
        correct: attempt.result.correct,
        total: attempt.result.total,
        score: attempt.result.score,
      };

      if (sectionIndex < run.sectionSlugs.length - 1) {
        run.currentIndex = sectionIndex + 1;
        run.completed = false;
        localStorage.setItem(RUN_KEY, JSON.stringify(run));
        setNextSection({
          code: run.sectionCodes[sectionIndex + 1],
          slug: run.sectionSlugs[sectionIndex + 1],
        });
        return;
      }

      const values = run.sectionSlugs.map((slug) => run.results[slug]).filter(Boolean);
      if (values.length !== run.sectionSlugs.length) return;
      const correct = values.reduce((sum, value) => sum + value.correct, 0);
      const total = values.reduce((sum, value) => sum + value.total, 0);
      const score = total ? Math.round((correct / total) * 100) : 0;
      let stats: Record<string, { attempts: number; bestScore: number }> = {};
      try { stats = JSON.parse(localStorage.getItem(STATS_KEY) || "{}"); } catch {}
      const previous = stats[run.suiteCode] || { attempts: 0, bestScore: 0 };
      const bestScore = Math.max(previous.bestScore, score);
      stats[run.suiteCode] = {
        attempts: Math.max(previous.attempts, run.attemptNo),
        bestScore,
      };
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
      run.completed = true;
      run.currentIndex = run.sectionSlugs.length - 1;
      localStorage.setItem(RUN_KEY, JSON.stringify(run));
      setNextSection(null);
      setSuiteSummary({ title: run.suiteTitle, attemptNo: run.attemptNo, score, bestScore, correct, total });
    } catch {
      setNextSection(null);
    }
  }, [attempt.id, attempt.kind, attempt.result, attempt.topic]);

  if (!attempt.result) return null;

  return (
    <>
      <PageHeading
        eyebrow={attempt.kind === "tryout" ? "HASIL SECTION" : "LANGKAH PERTAMA SUDAH TERLEWATI"}
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
            : attempt.kind === "tryout"
              ? "Tinjau hasil section ini. Pembahasan tersedia, lalu lanjutkan ke subtes berikutnya untuk menyelesaikan satu Mini Tryout utuh."
              : "Nilai sesi dan bukti mastery adalah dua ukuran berbeda."
        }
      />

      {attempt.kind === "tryout" && (
        <div className="tag-row" role="tablist" aria-label="Hasil paket">
          {[["result", "Hasil"], ["analysis", "Analisis"], ["solutions", "Pembahasan"]].map(([id, label]) => (
            <button key={id} role="tab" aria-selected={resultTab === id} className={`button ${resultTab === id ? "primary" : "secondary"}`} onClick={() => setResultTab(id)}>
              {label}
            </button>
          ))}
        </div>
      )}

      {(attempt.kind !== "tryout" || resultTab === "result") && (
        <section className="result-summary panel">
          <div className="score-circle">
            <strong>{attempt.result.score}<small>%</small></strong>
            <span>Akurasi sesi</span>
          </div>
          <div>
            <span className="eyebrow purple-text">{kindLabel[attempt.kind]}</span>
            <h2>{attempt.kind === "tryout" ? "Section selesai. Hasil ini menjadi bagian dari skor Mini Tryout." : "Sekarang kamu tahu langkah berikutnya."}</h2>
            <div className="result-counts">
              <span><strong>{attempt.result.correct}</strong>Benar</span>
              <span><strong>{attempt.result.incorrect}</strong>Salah</span>
              <span><strong>{attempt.result.unanswered}</strong>Belum dijawab</span>
            </div>
            <p className="muted small-text">Skor Mini Tryout akhir dihitung dari total jawaban benar seluruh PU, PK, dan PM. Mastery tetap dihitung terpisah dari skor sesi.</p>
          </div>
        </section>
      )}

      {attempt.kind === "tryout" && nextSection && resultTab === "result" && (
        <section className="mt-5 flex flex-col gap-4 rounded-2xl border border-[#cfeee8] bg-[#f2fcf9] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#14705f]">MINI TRYOUT BELUM SELESAI</span>
            <h3 className="mt-1 text-lg font-extrabold text-[#11182b]">Lanjut ke {nextSection.code}</h3>
            <p className="mt-1 text-sm text-[#697386]">Timer section berikutnya baru mulai setelah kamu menekan tombol lanjut.</p>
          </div>
          <button className="button primary" onClick={() => void start("tryout", nextSection.slug)}>Lanjut {nextSection.code} <ArrowRight size={17} /></button>
        </section>
      )}

      {(attempt.kind !== "tryout" || resultTab === "analysis") && (
        <div className="result-topics">
          {topics.filter((t) => attempt.questions.some((q) => q.topic === t.id)).map((t) => {
            const qs = attempt.questions.filter((q) => q.topic === t.id);
            const c = qs.filter((q) => attempt.answers[q.id] === q.correct).length;
            return (
              <div className="panel" key={t.id}>
                <span className="tag">{c / qs.length >= 0.8 ? "Kekuatan awal" : "Perlu diperkuat"}</span>
                <h3>{t.name}</h3>
                <p>{c} dari {qs.length} soal benar</p>
                <button className="text-button purple-text" onClick={() => { setTopic(t.id); go("learn"); }}>Pelajari konsep <ArrowRight size={15} /></button>
              </div>
            );
          })}
        </div>
      )}

      <div className="result-actions">
        <button className="button primary" onClick={() => { setTopic(attempt.kind === "tryout" ? recommended : attempt.topic || recommended); go("learn"); }}>Lanjut belajar <ArrowRight size={17} /></button>
        <button className="button secondary" onClick={() => go("progress")}>Lihat progres</button>
      </div>

      {(attempt.kind !== "tryout" || resultTab === "solutions") && (
        <section className="panel solutions">
          <h2>Pembahasan lengkap</h2>
          <p className="muted small-text">Pembahasan disusun per soal: diketahui/ditanyakan bila relevan, konsep, langkah pertama, penyelesaian, jawaban akhir, shortcut jika aman, kesalahan umum, dan analisis opsi jika tersedia.</p>
          {attempt.questions.map((item, i) => (
            <details key={item.id}>
              <summary>
                <span className={attempt.answers[item.id] === item.correct ? "solution-correct" : "solution-wrong"}>{attempt.answers[item.id] === undefined ? "—" : attempt.answers[item.id] === item.correct ? "✓" : "×"}</span>
                Soal {i + 1} · {topicName(item.topic)}
                <ChevronRight size={17} />
              </summary>
              <ContentMedia media={item.media} />
              {item.instruction && <Markdown text={item.instruction} />}
              {item.stimulus && <Markdown text={item.stimulus} />}
              <Markdown text={item.stem} />
              <p>Jawabanmu: {attempt.answers[item.id] === undefined ? "Tidak dijawab" : item.options[attempt.answers[item.id]]} · Jawaban benar: {item.options[item.correct!]}</p>
              {item.explanation && <Explanation value={item.explanation} />}
              <ReportIssue attemptId={attempt.id} questionId={item.id} view="solutions" />
            </details>
          ))}
        </section>
      )}

      {suiteSummary && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-[#0b1020]/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Hasil Mini Tryout">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#405fd6]">MINI TRYOUT SELESAI</span><h2 className="mt-2 text-xl font-black text-[#11182b]">{suiteSummary.title}</h2></div>
              <button className="grid h-10 w-10 place-items-center rounded-full bg-[#f2f4f7] text-[#596477]" onClick={() => setSuiteSummary(null)} aria-label="Tutup"><X size={18} /></button>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-[#f7f8fa] p-4"><span className="text-[10px] font-bold text-[#7a8496]">PERCOBAAN</span><strong className="mt-1 block text-2xl text-[#11182b]">#{suiteSummary.attemptNo}</strong></div>
              <div className="rounded-2xl bg-[#eef2ff] p-4"><span className="text-[10px] font-bold text-[#405fd6]">SKOR</span><strong className="mt-1 block text-2xl text-[#11182b]">{suiteSummary.score}%</strong></div>
              <div className="rounded-2xl bg-[#f3ffde] p-4"><span className="text-[10px] font-bold text-[#66891b]">BEST</span><strong className="mt-1 block text-2xl text-[#11182b]">{suiteSummary.bestScore}%</strong></div>
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#dfe4ec] p-4"><Trophy size={20} className="text-[#7c9b19]" /><p className="text-sm leading-6 text-[#596477]"><strong className="text-[#11182b]">{suiteSummary.correct}/{suiteSummary.total}</strong> soal benar. Nilai terbaik dipertahankan sebagai pencapaian Mini Tryout.</p></div>
            <button className="mt-5 flex min-h-12 w-full items-center justify-center rounded-xl bg-[#0b1020] px-4 text-sm font-extrabold text-white" onClick={() => setSuiteSummary(null)}>Lihat analisis & pembahasan</button>
          </div>
        </div>
      )}
    </>
  );
}
