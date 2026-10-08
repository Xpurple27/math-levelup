"use client";
import {
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  Check,
  Clock,
  Flame,
  GraduationCap,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
  ShieldCheck,
} from "lucide-react";
import type { Mastery } from "@/lib/scoring";
import { Stat } from "./view-ui";
import { topicName } from "./labels";
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
export function DashboardView({
  user,
  busy,
  start,
  history,
  avg,
  solved,
  streak,
  weakest,
  recommended,
  setTopic,
  go,
}: Props) {
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR NEXT LEVEL STARTS HERE</div>
          <h1>
            {user ? `Halo, ${user.name.split(" ")[0]}` : "Halo, Sobat LevelUP"}{" "}
            <span className="wave">✦</span>
          </h1>
          <p>Langkah kecil hari ini, kemajuan nyata untuk UTBK nanti.</p>
        </div>
        <span className="exam-chip">
          <GraduationCap size={17} /> Persiapan UTBK 2027
        </span>
      </div>
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-label">
            <span /> KENALI POTENSIMU
          </span>
          <h2>
            Bukan sekadar nilai.
            <br />
            Temukan langkah
            <br />
            <em>belajar yang tepat.</em>
          </h2>
          <p>
            Mulai dengan diagnostik singkat. Kenali kekuatanmu,
            <br className="desktop" /> temukan yang perlu dilatih, dan naik
            level bersama kami.
          </p>
          <button
            className="button yellow"
            disabled={busy}
            onClick={() => start("diagnostic")}
          >
            {history.some((h) => h.kind === "diagnostic")
              ? "Ulangi diagnostik"
              : "Mulai diagnostik gratis"}
            <ArrowRight size={18} />
          </button>
          <div className="hero-meta">
            <span>
              <Clock size={14} />
              30 menit
            </span>
            <span>
              <BookOpen size={14} />
              15 soal
            </span>
            <span>
              <ShieldCheck size={14} />
              Tanpa tekanan
            </span>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <span className="math-float float-one">x² + y²</span>
          <span className="math-float float-two">π</span>
          <span className="math-float float-three">√x</span>
          <div className="level-card">
            <div className="level-card-top">
              <span className="mini-mark">
                <TrendingUp size={20} />
              </span>
              <span>
                LEVEL UP
                <br />
                <small>YOUR POTENTIAL</small>
              </span>
              <Sparkles size={19} />
            </div>
            <div className="chart-art">
              <div />
              <div />
              <div />
              <div />
              <div />
            </div>
            <div className="art-line" />
            <div className="level-card-bottom">
              <span>Setiap langkah berarti.</span>
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div className="art-badge">
            <span>
              <Check size={17} />
            </span>
            Lebih paham. Lebih siap.
          </div>
          <div className="star-art">✳︎</div>
        </div>
      </section>
      <div className="stat-grid">
        <Stat
          icon={<Target size={21} />}
          label="Math mastery"
          value={avg === null ? "Belum diukur" : `${avg}%`}
          foot={
            avg === null
              ? "Kenali kemampuan awalmu"
              : "Berdasarkan bukti belajar"
          }
          color="purple"
        />
        <Stat
          icon={<BookOpen size={21} />}
          label="Soal diselesaikan"
          value={String(solved)}
          foot="Satu soal, satu langkah maju"
          color="blue"
        />
        <Stat
          icon={<Flame size={21} />}
          label="Streak belajar"
          value={`${streak} hari`}
          foot="Belajar aktif, bukan sekadar login"
          color="orange"
        />
        <Stat
          icon={<GraduationCap size={21} />}
          label="Target UTBK"
          value={String(user?.goal || 700)}
          foot="Targetmu, arah perjalananmu"
          color="green"
        />
      </div>
      <div className="dashboard-lower">
        <section>
          <div className="section-heading">
            <h2>Langkah berikutnya</h2>
            <span className="muted small-text">Dibuat untuk perjalananmu</span>
          </div>
          <div className="next-card">
            <div className="next-icon">
              <BookOpen size={25} />
            </div>
            <div>
              <span className="eyebrow purple-text">
                {weakest ? "REKOMENDASI BELAJAR" : "MULAI DARI DASAR"}
              </span>
              <h3>{topicName(recommended)}</h3>
              <p>
                {weakest
                  ? "Perkuat konsep dari profil kemampuan awalmu."
                  : "Rekomendasi awal ini belum berbasis diagnostik. Mulai dari fondasi atau ukur kemampuanmu terlebih dahulu."}
              </p>
              <div className="tag-row">
                <span>Konsep + contoh</span>
                <span>± 15 menit</span>
                <span className="green-tag">Gratis</span>
              </div>
            </div>
            <button
              className="round-arrow"
              aria-label="Buka rekomendasi belajar"
              onClick={() => {
                setTopic(recommended);
                go("learn");
              }}
            >
              <ArrowUpRight size={22} />
            </button>
          </div>
          <div className="quick-cards">
            <button onClick={() => go("practice")}>
              <span className="quick-icon orange">
                <Zap size={21} />
              </span>
              <strong>Latihan harian</strong>
              <p>Sedikit latihan, banyak kemajuan.</p>
              <span className="quick-link">
                Mulai latihan <ArrowRight size={15} />
              </span>
            </button>
            <button onClick={() => go("tryout")}>
              <span className="quick-icon blue">
                <Target size={21} />
              </span>
              <strong>Ukur kesiapanmu</strong>
              <p>Kenali kemampuan PK, PM & PU.</p>
              <span className="quick-link">
                Lihat asesmen <ArrowRight size={15} />
              </span>
            </button>
          </div>
        </section>
        <section className="journey-card">
          <div className="section-heading">
            <h2>Perjalanan belajarmu</h2>
            <span className="green-dot" />
          </div>
          <p>Kemajuan dimulai dari mengenal diri.</p>
          <div className="journey-steps">
            {[
              {
                title: "Kenali kemampuan",
                desc: "Diagnostik & profil awal",
                done: history.some((h) => h.kind === "diagnostic"),
              },
              {
                title: "Pahami konsep",
                desc: "Belajar sesuai kebutuhanmu",
                done: history.some((h) => h.kind === "mini"),
              },
              {
                title: "Latih & naik level",
                desc: "Buktikan dengan latihan",
                done: history.some((h) => h.kind === "practice"),
              },
            ].map((s, i) => (
              <div
                className={`journey-step ${s.done ? "done" : ""}`}
                key={s.title}
              >
                <span>{s.done ? <Check size={15} /> : i + 1}</span>
                <div>
                  <strong>{s.title}</strong>
                  <small>{s.desc}</small>
                </div>
              </div>
            ))}
          </div>
          <div className="journey-note">
            <Sparkles size={17} />
            <span>
              Tak perlu sempurna.
              <br />
              Yang penting, terus melangkah.
            </span>
          </div>
        </section>
      </div>
      <div className="bottom-note">
        <ShieldCheck size={15} />
        Belajar terarah. Penilaian transparan. Progres yang berarti.
        <span>LEVELUP MATH · BETA</span>
      </div>
    </>
  );
}
