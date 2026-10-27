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
  diagnosticReady: boolean;
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
  diagnosticReady,
  setTopic,
  go,
}: Props) {
  const topicName = useTopicName();
  const published = usePublishedCount();
  const hasDiagnostic = history.some(
    (h) => h.kind === "diagnostic" && h.result.total > h.result.unanswered,
  );
  const learningReady = Boolean(recommended);
  const confidence = weakest ? Math.round(weakest.confidence * 100) : null;

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR LEARNING DIRECTION</div>
          <h1>
            {user ? `Halo, ${user.name}` : "Halo"}{" "}
            <span className="wave">↗</span>
          </h1>
          <p>
            {hasDiagnostic
              ? "Lihat posisi kemampuanmu, lalu lanjutkan ke area yang paling membutuhkan bukti berikutnya."
              : "Mulai dengan mengetahui posisi kemampuanmu sebelum memilih arah belajar."}
          </p>
        </div>
        <span className="exam-chip">
          <GraduationCap size={17} /> Persiapan UTBK 2027
        </span>
      </div>

      <section className={`hero ${hasDiagnostic ? "hero-complete" : ""}`}>
        <div className="hero-copy">
          <span className="hero-label">
            <span />
            {hasDiagnostic
              ? "CURRENT POSITION AVAILABLE"
              : "FIND YOUR CURRENT POSITION"}
          </span>
          {hasDiagnostic ? (
            <>
              <h2>
                Current Position identified.
                <br />
                {learningReady ? (
                  <>
                    Next Direction: <em>{topicName(recommended)}.</em>
                  </>
                ) : (
                  <em>Learning path sedang disiapkan.</em>
                )}
              </h2>
              <p>
                Mastery dan confidence adalah indikator internal berbasis bukti
                latihan, bukan prediksi skor resmi UTBK atau probabilitas
                statistik.
              </p>
              <div className="diagnostic-actions">
                <button
                  className="button yellow"
                  onClick={() => go("progress")}
                >
                  View Learning Profile <ArrowRight size={18} />
                </button>
                <button
                  className="diagnostic-retake"
                  disabled={busy || !diagnosticReady}
                  onClick={() => start("diagnostic")}
                >
                  Ulangi diagnostic
                </button>
              </div>
            </>
          ) : (
            <>
              <h2>
                Know where you are.
                <br />
                Then know <em>where to go next.</em>
              </h2>
              <p>
                VECTRA Diagnostic memetakan bukti kemampuan awal sebelum memberi
                arah belajar berikutnya.
              </p>
              <button
                className="button yellow"
                disabled={busy || !diagnosticReady}
                onClick={() => start("diagnostic")}
              >
                Start Diagnostic ↗
              </button>
              {!diagnosticReady && (
                <p
                  style={{
                    marginTop: 10,
                    marginBottom: 0,
                    color: "#B7FF3C",
                  }}
                >
                  Diagnostic belum tersedia. Cakupan 15 soal PK, PM, dan PU
                  dengan tingkat kesulitan yang diperlukan belum lengkap.
                </p>
              )}
              <div className="hero-meta">
                <span>
                  <Clock size={14} /> 15 soal · maksimal 30 menit
                </span>
                <span>
                  <BookOpen size={14} /> {published || 0} soal tersedia
                </span>
                <span>
                  <ShieldCheck size={14} /> Tanpa feedback selama tes
                </span>
              </div>
            </>
          )}
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="level-card">
            <div className="level-card-top">
              <span className="mini-mark">
                <Crosshair size={20} />
              </span>
              <span>
                POSITION
                <br />
                <small>LEARNING PROFILE</small>
              </span>
              <Compass size={19} />
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
                  ? learningReady
                    ? "Direction ready."
                    : "Evidence captured."
                  : "Build the first evidence."}
              </span>
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div className="art-badge">
            <span>
              <Route size={17} />
            </span>
            {hasDiagnostic
              ? learningReady
                ? "Next Direction available"
                : "Waiting for a published learning path"
              : "Position → Direction → Progress"}
          </div>
        </div>
      </section>

      <div className="stat-grid">
        <Stat
          icon={<Target size={21} />}
          label="Mastery"
          value={avg === null ? "Belum diukur" : `${avg}%`}
          foot={
            avg === null
              ? "Belum ada bukti belajar yang cukup"
              : "Indikator internal dari bukti belajar"
          }
          color="purple"
        />
        <Stat
          icon={<Compass size={21} />}
          label="Confidence"
          value={confidence === null ? "Belum diukur" : `${confidence}%`}
          foot="Kecukupan dan keragaman bukti; bukan probabilitas"
          color="blue"
        />
        <Stat
          icon={<BookOpen size={21} />}
          label="Jawaban terkirim"
          value={String(solved)}
          foot="Termasuk pengulangan dalam 30 sesi terakhir"
          color="orange"
        />
        <Stat
          icon={<Flame size={21} />}
          label="Learning streak"
          value={`${streak} hari`}
          foot="Aktivitas belajar yang tercatat"
          color="green"
        />
      </div>

      <div className="dashboard-lower">
        <section>
          <div className="section-heading">
            <h2>Next Direction ↗</h2>
            <span className="muted small-text">
              Satu prioritas pada satu waktu
            </span>
          </div>
          <div className="next-card">
            <div className="next-icon">
              <Route size={25} />
            </div>
            <div>
              <span className="eyebrow purple-text">
                {learningReady
                  ? weakest
                    ? "RECOMMENDED LEARNING"
                    : "PUBLISHED LEARNING PATH"
                  : "NO PUBLISHED DIRECTION YET"}
              </span>
              <h3>
                {learningReady
                  ? topicName(recommended)
                  : "Learning path belum tersedia"}
              </h3>
              <p>
                {learningReady
                  ? weakest
                    ? `Indikator mastery ${weakest.value}% dari ${weakest.count} soal unik; kecukupan bukti ${Math.round(weakest.confidence * 100)}%. Area ini memiliki mastery terendah di antara keterampilan dengan materi, latihan gratis, dan asesmen ulang yang tersedia.`
                    : "Materi ini sudah tersedia untuk membangun bukti kemampuan pertamamu."
                  : "Bukti kemampuan tetap tersimpan, tetapi VECTRA tidak akan mengarahkanmu ke materi kosong. Pilih Practice atau tunggu learning path dipublikasikan."}
              </p>
              {learningReady && (
                <div className="tag-row">
                  <span>Konsep + contoh</span>
                  <span>Published path</span>
                  <span className="green-tag">Direction</span>
                </div>
              )}
            </div>
            <button
              className="round-arrow"
              aria-label="Buka rekomendasi belajar"
              disabled={!learningReady}
              onClick={() => {
                if (!learningReady) return;
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
              <strong>VECTRA Practice</strong>
              <p>Practice what matters pada domain yang ingin diperkuat.</p>
              <span className="quick-link">
                Open Practice <ArrowRight size={15} />
              </span>
            </button>
            <button onClick={() => go("tryout")}>
              <span className="quick-icon blue">
                <Target size={21} />
              </span>
              <strong>VECTRA Assessment</strong>
              <p>
                Ukur kesiapan dalam sesi dengan batas waktu dan hasil
                terstruktur.
              </p>
              <span className="quick-link">
                Open Assessment <ArrowRight size={15} />
              </span>
            </button>
          </div>
        </section>

        <section className="journey-card">
          <div className="section-heading">
            <h2>Learning trajectory</h2>
            <span className="green-dot" />
          </div>
          <p>
            Progress bergerak dari posisi yang diketahui menuju arah yang
            dibuktikan.
          </p>
          <div className="journey-steps">
            {[
              {
                title: "Position",
                desc: "Diagnostic & learning profile",
                done: hasDiagnostic,
              },
              {
                title: "Direction",
                desc: "Published recommended learning",
                done: hasDiagnostic && learningReady,
              },
              {
                title: "Progress",
                desc: "Practice & assessment evidence",
                done:
                  history.some((h) => h.kind === "practice") ||
                  history.some((h) => h.kind === "tryout"),
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
              Measure the ability.
              <br />
              Find the direction.
            </span>
          </div>
        </section>
      </div>
    </>
  );
}
