"use client";

import { usePublishedCount } from "../content-context";
import {
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  Check,
  Clock,
  Compass,
  Crosshair,
  Flame,
  GraduationCap,
  Route,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
  ShieldCheck,
} from "lucide-react";
import type { Mastery } from "@/lib/scoring";
import { Stat } from "./view-ui";
import { useTopicName } from "./labels";
import type { View, User, History } from "./types";
import type { Dispatch, SetStateAction } from "react";

type Props = {
  user: User | null;
  busy: boolean;
  start: (kind: string, t?: string) => Promise<void>;
  history: History[];
  avg: number | null;
  solved: number;
  streak: number;
  weakest: Mastery | undefined;
  recommended: string;
  setTopic: Dispatch<SetStateAction<string>>;
  go: (v: View) => void;
};

export function DashboardView({ user, busy, start, history, avg, solved, streak, weakest, recommended, setTopic, go }: Props) {
  const topicName = useTopicName();
  const published = usePublishedCount();
  const hasDiagnostic = history.some((h) => h.kind === "diagnostic");
  const diagnosticReady = published > 0;
  const confidence = weakest ? Math.round(weakest.confidence * 100) : null;

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR LEARNING DIRECTION</div>
          <h1>{user ? `Halo, ${user.name}` : "Halo"} <span className="wave">↗</span></h1>
          <p>
            {hasDiagnostic
              ? "Lihat posisi kemampuanmu, lalu lanjutkan ke area yang paling membutuhkan bukti berikutnya."
              : "Mulai dengan mengetahui posisi kemampuanmu sebelum memilih arah belajar."}
          </p>
        </div>
        <span className="exam-chip"><GraduationCap size={17} /> Persiapan UTBK 2027</span>
      </div>

      <section className={`hero ${hasDiagnostic ? "hero-complete" : ""}`}>
        <div className="hero-copy">
          <span className="hero-label"><span />{hasDiagnostic ? "CURRENT POSITION AVAILABLE" : "FIND YOUR CURRENT POSITION"}</span>
          {hasDiagnostic ? (
            <>
              <h2>Current Position identified.<br />Next Direction: <em>{topicName(recommended)}.</em></h2>
              <p>
                Gunakan mastery dan confidence sebagai konteks, lalu bangun bukti baru pada area yang paling perlu diperkuat.
              </p>
              <div className="diagnostic-actions">
                <button className="button yellow" onClick={() => go("progress")}>View Learning Profile <ArrowRight size={18} /></button>
                <button className="diagnostic-retake" disabled={busy || !diagnosticReady} onClick={() => start("diagnostic")}>Ulangi diagnostic</button>
              </div>
            </>
          ) : (
            <>
              <h2>Know where you are.<br />Then know <em>where to go next.</em></h2>
              <p>VECTRA Diagnostic memetakan kekuatan dan learning gap sebelum memberi arah belajar berikutnya.</p>
              <button className="button yellow" disabled={busy || !diagnosticReady} onClick={() => start("diagnostic")}>Start Diagnostic ↗</button>
              {!diagnosticReady && <p style={{ marginTop: 10, marginBottom: 0, color: "#B7FF3C" }}>Diagnostic belum tersedia karena belum ada soal yang dipublikasikan.</p>}
              <div className="hero-meta">
                <span><Clock size={14} /> ± 10 menit</span>
                <span><BookOpen size={14} /> {published || 0} soal tersedia</span>
                <span><ShieldCheck size={14} /> Tanpa feedback selama tes</span>
              </div>
            </>
          )}
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="level-card">
            <div className="level-card-top">
              <span className="mini-mark"><Crosshair size={20} /></span>
              <span>POSITION<br /><small>LEARNING PROFILE</small></span>
              <Compass size={19} />
            </div>
            <div className="chart-art"><div /><div /><div /><div /><div /></div>
            <div className="art-line" />
            <div className="level-card-bottom"><span>{hasDiagnostic ? "Direction ready." : "Build the first evidence."}</span><ArrowUpRight size={20} /></div>
          </div>
          <div className="art-badge"><span><Route size={17} /></span>{hasDiagnostic ? "Next Direction available" : "Position → Direction → Progress"}</div>
        </div>
      </section>

      <div className="stat-grid">
        <Stat icon={<Target size={21} />} label="Mastery" value={avg === null ? "Belum diukur" : `${avg}%`} foot={avg === null ? "Belum ada bukti belajar yang cukup" : "Berdasarkan bukti belajar"} color="purple" />
        <Stat icon={<Compass size={21} />} label="Confidence" value={confidence === null ? "Belum diukur" : `${confidence}%`} foot="Kekuatan bukti pada area prioritas" color="blue" />
        <Stat icon={<BookOpen size={21} />} label="Evidence" value={String(solved)} foot="Soal yang sudah menjadi bukti belajar" color="orange" />
        <Stat icon={<Flame size={21} />} label="Learning streak" value={`${streak} hari`} foot="Aktivitas belajar yang tercatat" color="green" />
      </div>

      <div className="dashboard-lower">
        <section>
          <div className="section-heading"><h2>Next Direction ↗</h2><span className="muted small-text">Satu prioritas pada satu waktu</span></div>
          <div className="next-card">
            <div className="next-icon"><Route size={25} /></div>
            <div>
              <span className="eyebrow purple-text">{weakest ? "RECOMMENDED LEARNING" : "BUILD YOUR FIRST PROFILE"}</span>
              <h3>{topicName(recommended)}</h3>
              <p>{weakest ? "Area ini menjadi prioritas dari bukti kemampuan yang tersedia." : "Belum ada cukup bukti. Mulai dari diagnostic untuk menentukan arah pertama."}</p>
              <div className="tag-row"><span>Konsep + contoh</span><span>± 15 menit</span><span className="green-tag">Direction</span></div>
            </div>
            <button className="round-arrow" aria-label="Buka rekomendasi belajar" onClick={() => { setTopic(recommended); go("learn"); }}><ArrowUpRight size={22} /></button>
          </div>

          <div className="quick-cards">
            <button onClick={() => go("practice")}>
              <span className="quick-icon orange"><Zap size={21} /></span>
              <strong>VECTRA Practice</strong>
              <p>Practice what matters pada domain yang ingin diperkuat.</p>
              <span className="quick-link">Open Practice <ArrowRight size={15} /></span>
            </button>
            <button onClick={() => go("tryout")}>
              <span className="quick-icon blue"><Target size={21} /></span>
              <strong>VECTRA Assessment</strong>
              <p>Ukur kesiapan dalam sesi dengan batas waktu dan hasil terstruktur.</p>
              <span className="quick-link">Open Assessment <ArrowRight size={15} /></span>
            </button>
          </div>
        </section>

        <section className="journey-card">
          <div className="section-heading"><h2>Learning trajectory</h2><span className="green-dot" /></div>
          <p>Progress bergerak dari posisi yang diketahui menuju arah yang dibuktikan.</p>
          <div className="journey-steps">
            {[
              { title: "Position", desc: "Diagnostic & learning profile", done: hasDiagnostic },
              { title: "Direction", desc: "Recommended learning", done: history.some((h) => h.kind === "mini") },
              { title: "Progress", desc: "Practice & assessment evidence", done: history.some((h) => h.kind === "practice") },
            ].map((s, i) => (
              <div className={`journey-step ${s.done ? "done" : ""}`} key={s.title}>
                <span>{s.done ? <Check size={15} /> : i + 1}</span>
                <div><strong>{s.title}</strong><small>{s.desc}</small></div>
              </div>
            ))}
          </div>
          <div className="journey-note"><Sparkles size={17} /><span>Measure the ability.<br />Find the direction.</span></div>
        </section>
      </div>
    </>
  );
}
