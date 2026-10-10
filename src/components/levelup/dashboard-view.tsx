"use client";

import { usePublishedCount } from "../content-context";
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
  const topicName = useTopicName();
  const published = usePublishedCount();
  const hasDiagnostic = history.some((h) => h.kind === "diagnostic");

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">FOKUSMU HARI INI</div>
          <h1>
            {user ? `Halo, ${user.name.split(" ")[0]}` : "Halo, Sobat LevelUP"}{" "}
            <span className="wave">✦</span>
          </h1>
          <p>
            {hasDiagnostic
              ? "Profil awalmu sudah terbentuk. Sekarang lanjutkan dari area yang paling membutuhkan perhatian."
              : "Kenali kemampuan awalmu sebelum memilih apa yang perlu dipelajari."}
          </p>
        </div>
        <span className="exam-chip">
          <GraduationCap size={17} /> Persiapan UTBK 2027
        </span>
      </div>

      {!published && (
        <div className="content-waiting-state" role="status">
          <strong>Konten baru sedang dikurasi.</strong>
          <span>
            Mesin belajar tetap aktif, tetapi sesi baru menunggu soal production
            diterbitkan.
          </span>
        </div>
      )}

      <section className={`hero ${hasDiagnostic ? "hero-complete" : ""}`}>
        <div className="hero-copy">
          <span className="hero-label">
            <span />{" "}
            {hasDiagnostic ? "PROFIL AWAL TERSEDIA" : "KENALI TITIK AWALMU"}
          </span>
          {hasDiagnostic ? (
            <>
              <h2>
                Kamu sudah tahu titik awal.
                <br />
                Sekarang perkuat <em>{topicName(recommended)}.</em>
              </h2>
              <p>
                Diagnostikmu sudah selesai. Gunakan profil kemampuan untuk
                melihat area kuat, area yang perlu diperkuat, dan langkah
                belajar berikutnya.
              </p>
              <div className="diagnostic-actions">
                <button
                  className="button yellow"
                  onClick={() => go("progress")}
                >
                  Lihat profil kemampuan <ArrowRight size={18} />
                </button>
                <button
                  className="diagnostic-retake"
                  disabled={busy || !published}
                  onClick={() => start("diagnostic")}
                >
                  Ulangi diagnostik
                </button>
              </div>
            </>
          ) : (
            <>
              <h2>
                Jangan mulai dari tebakan.
                <br />
                Mulai dari <em>kemampuanmu sekarang.</em>
              </h2>
              <p>
                Diagnostik membantu memetakan kekuatan dan kelemahanmu sebelum
                LevelUP merekomendasikan apa yang perlu dipelajari lebih dulu.
              </p>
              <button
                className="button yellow"
                disabled={busy || !published}
                onClick={() => start("diagnostic")}
              >
                Mulai diagnostik <ArrowRight size={18} />
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
                  Tanpa feedback selama tes
                </span>
              </div>
            </>
          )}
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
              <span>
                {hasDiagnostic
                  ? "Profilmu siap digunakan."
                  : "Setiap langkah berarti."}
              </span>
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div className="art-badge">
            <span>
              <Check size={17} />
            </span>
            {hasDiagnostic ? "Diagnostic complete" : "Lebih paham. Lebih siap."}
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
              ? "Belum ada bukti belajar yang cukup"
              : "Berdasarkan bukti belajar"
          }
          color="purple"
        />
        <Stat
          icon={<BookOpen size={21} />}
          label="Soal diselesaikan"
          value={String(solved)}
          foot="Satu soal, satu bukti belajar"
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
            <span className="muted small-text">Satu fokus pada satu waktu</span>
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
                  ? "Perkuat konsep dari profil kemampuanmu."
                  : "Belum ada cukup bukti. Mulai dari fondasi atau lakukan diagnostik terlebih dahulu."}
              </p>
              <div className="tag-row">
                <span>Konsep + contoh</span>
                <span>± 15 menit</span>
                <span className="green-tag">Terarah</span>
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
              <strong>Latihan terarah</strong>
              <p>Pilih subtopik dan tingkat kesulitan sesuai kebutuhanmu.</p>
              <span className="quick-link">
                Mulai latihan <ArrowRight size={15} />
              </span>
            </button>
            <button onClick={() => go("tryout")}>
              <span className="quick-icon blue">
                <Target size={21} />
              </span>
              <strong>Ukur kesiapanmu</strong>
              <p>Gunakan paket asesmen setelah kontennya siap diterbitkan.</p>
              <span className="quick-link">
                Lihat tryout <ArrowRight size={15} />
              </span>
            </button>
          </div>
        </section>

        <section className="journey-card">
          <div className="section-heading">
            <h2>Perjalanan belajarmu</h2>
            <span className="green-dot" />
          </div>
          <p>
            Kemajuan dimulai dari mengenali posisi, lalu memilih langkah yang
            tepat.
          </p>
          <div className="journey-steps">
            {[
              {
                title: "Kenali kemampuan",
                desc: "Diagnostik & profil awal",
                done: hasDiagnostic,
              },
              {
                title: "Pahami konsep",
                desc: "Belajar sesuai kebutuhanmu",
                done: history.some((h) => h.kind === "mini"),
              },
              {
                title: "Latih & ukur",
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
              Fokus pada langkah berikutnya,
              <br />
              bukan pada semua hal sekaligus.
            </span>
          </div>
        </section>
      </div>
    </>
  );
}
