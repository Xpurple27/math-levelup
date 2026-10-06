"use client";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  ChartNoAxesCombined,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  GraduationCap,
  Grid2X2,
  LogOut,
  Menu,
  Sparkles,
  Target,
  TrendingUp,
  X,
  Zap,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { topics } from "@/lib/topics";
import type { Mastery } from "@/lib/scoring";
import { masteryLabel } from "@/lib/scoring";
type View =
  | "dashboard"
  | "learn"
  | "practice"
  | "tryout"
  | "progress"
  | "exam"
  | "result";
type User = {
  id: string;
  name: string;
  email: string;
  grade: string;
  goal: number;
};
type Result = {
  score: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  total: number;
};
type Q = {
  id: string;
  topic: string;
  section: string;
  difficulty: string;
  stem: string;
  options: string[];
  correct?: number;
  hint?: string;
  explanation?: { firstStep: string; solution: string; mistake: string };
};
type Attempt = {
  id: string;
  kind: string;
  topic: string | null;
  started: number;
  deadline: number | null;
  serverNow: number;
  status: string;
  questions: Q[];
  answers: Record<string, number>;
  feedback: Record<
    string,
    { tries: number; done: boolean; correct: boolean; selected: number }
  >;
  result: Result | null;
};
type History = {
  id: string;
  kind: string;
  topic: string | null;
  started: number;
  result: Result;
};
const nav = [
  { id: "dashboard", label: "Beranda", icon: Grid2X2 },
  { id: "learn", label: "Belajar", icon: BookOpen },
  { id: "practice", label: "Latihan", icon: Zap },
  { id: "tryout", label: "Tryout", icon: Target },
  { id: "progress", label: "Progres", icon: ChartNoAxesCombined },
] as const;
const kindLabel: Record<string, string> = {
  diagnostic: "Diagnostik awal",
  guided: "Latihan terbimbing",
  mini: "Mini assessment",
  practice: "Latihan mandiri",
};
const topicName = (id: string | null) =>
  topics.find((t) => t.id === id)?.name || "PK · PM · PU";
export default function Levelup() {
  const [user, setUser] = useState<User | null>(null),
    [ready, setReady] = useState(false),
    [view, setView] = useState<View>("dashboard"),
    [mastery, setMastery] = useState<Mastery[]>([]),
    [history, setHistory] = useState<History[]>([]),
    [streak, setStreak] = useState(0),
    [days, setDays] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState("Mixed");
  const [section, setSection] = useState("All");
  const [search, setSearch] = useState("");
  const [backend, setBackend] = useState<"local" | "supabase">("local");
  const [auth, setAuth] = useState<
      "login" | "register" | "confirmation" | null
    >(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [topic, setTopic] = useState("rasio"),
    [count, setCount] = useState(5),
    [attempt, setAttempt] = useState<Attempt | null>(null),
    [index, setIndex] = useState(0),
    [clock, setClock] = useState(() => Date.now()),
    [offset, setOffset] = useState(0),
    [mobile, setMobile] = useState(false),
    [confirm, setConfirm] = useState(false),
    [notice, setNotice] = useState("");
  const refresh = useCallback(async () => {
    const r = await fetch("/api/action");
    const d = await r.json();
    setUser(d.user);
    if (d.user) sessionStorage.removeItem("levelup-email-confirmation");
    setBackend(d.backend || "local");
    if (d.notice) setError(d.notice);
    setMastery(d.mastery || []);
    setHistory(d.history || []);
    setStreak(d.streak || 0);
    setDays(d.days || []);
    setReady(true);
  }, []);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("auth_error"))
      setTimeout(
        () =>
          setError(
            "Tautan konfirmasi tidak berlaku. Coba masuk atau minta email konfirmasi baru.",
          ),
        0,
      );
    const timer = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(timer);
  }, [refresh]);
  useEffect(() => {
    if (!user) return;
    const id = localStorage.getItem("levelup-attempt");
    if (id) {
      fetch(`/api/action?attempt=${encodeURIComponent(id)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.attempt) {
            setAttempt(d.attempt);
            setOffset(d.attempt.serverNow - Date.now());
            setView(d.attempt.status === "completed" ? "result" : "exam");
            if (d.attempt.status === "completed")
              localStorage.removeItem("levelup-attempt");
          } else localStorage.removeItem("levelup-attempt");
        });
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const syncAttempt = useCallback(
    (a: Attempt) => {
      setAttempt(a);
      setOffset(a.serverNow - Date.now());
      if (a.status === "completed") {
        setView("result");
        setConfirm(false);
        localStorage.removeItem("levelup-attempt");
        void refresh();
      } else localStorage.setItem("levelup-attempt", a.id);
    },
    [refresh],
  );
  useEffect(() => {
    if (view !== "exam" || !attempt || attempt.status !== "active") return;
    const tick = setInterval(() => setClock(Date.now()), 1000);
    const poll = setInterval(() => {
      fetch(`/api/action?attempt=${attempt.id}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.attempt) syncAttempt(d.attempt);
        });
    }, 15000);
    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
  }, [view, attempt?.id, attempt?.status, syncAttempt]); // eslint-disable-line react-hooks/exhaustive-deps
  const call = async (data: Record<string, unknown>) => {
    setError("");
    setBusy(true);
    try {
      const r = await fetch("/api/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Terjadi kesalahan.");
      return d;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Koneksi gagal.");
      return null;
    } finally {
      setBusy(false);
    }
  };
  const submit = useCallback(async () => {
    if (!attempt) return;
    setBusy(true);
    try {
      const r = await fetch("/api/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit", id: attempt.id }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error);
        return;
      }
      syncAttempt(d.attempt);
    } catch {
      setError("Koneksi terputus. Jawaban yang sudah tersimpan tetap aman.");
    } finally {
      setBusy(false);
    }
  }, [attempt, syncAttempt]);
  useEffect(() => {
    if (
      view === "exam" &&
      attempt?.status === "active" &&
      attempt.deadline &&
      clock + offset >= attempt.deadline &&
      !busy
    ) {
      const timer = setTimeout(() => void submit(), 0);
      return () => clearTimeout(timer);
    }
  }, [clock, offset, view, attempt, busy, submit]);
  const go = (v: View) => {
    if (v === "learn") setSearch("");
    setView(v);
    setMobile(false);
    setError("");
    setNotice("");
  };
  const start = async (kind: string, t = topic) => {
    if (!user) {
      const pending = sessionStorage.getItem("levelup-email-confirmation");
      setAuth(pending ? "login" : "register");
      setNotice(
        pending
          ? "Konfirmasikan email Anda, lalu masuk untuk mulai latihan."
          : "Buat akun untuk menyimpan jawaban dan progres Anda.",
      );
      return;
    }
    const d = await call({
      action: "start",
      kind,
      topic: t,
      count,
      difficulty,
    });
    if (d) {
      syncAttempt(d.attempt);
      setIndex(0);
      setView(d.attempt.status === "completed" ? "result" : "exam");
    }
  };
  const weakest = [...mastery].sort(
    (a, b) => a.value - b.value || a.confidence - b.confidence,
  )[0];
  const recommended = weakest?.topic || "rasio";
  const avg = mastery.length
    ? Math.round(mastery.reduce((s, m) => s + m.value, 0) / mastery.length)
    : null;
  const solved = history.reduce(
    (s, h) => s + h.result.total - h.result.unanswered,
    0,
  );
  const q = attempt?.questions[index];
  const feedback = q && attempt?.feedback[q.id];
  const selected = q
    ? (attempt?.answers[q.id] ?? feedback?.selected)
    : undefined;
  const answered = attempt ? Object.keys(attempt.answers).length : 0;
  const time = attempt
    ? Math.max(
        0,
        Math.floor(
          (attempt.deadline
            ? attempt.deadline - clock - offset
            : clock + offset - attempt.started) / 1000,
        ),
      )
    : 0;
  const timeText = `${Math.floor(time / 60)
    .toString()
    .padStart(2, "0")}:${(time % 60).toString().padStart(2, "0")}`;
  const date = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date());
  const currentTopic = topics.find((t) => t.id === topic)!;
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <Link className="brand" href="/" aria-label="LevelUP Math beranda">
          <span className="brand-mark">
            <TrendingUp size={22} />
          </span>
          <span>
            Level<span className="brand-up">UP</span>
            <small>MATH</small>
          </span>
        </Link>
        <button
          className="mobile-close icon-button"
          onClick={() => setMobile(false)}
          aria-label="Tutup menu"
        >
          <X size={20} />
        </button>
        <div className="workspace-label">RUANG BELAJAR</div>
        <nav>
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => go(n.id)}
              className={`nav-item ${view === n.id ? "active" : ""}`}
            >
              <n.icon size={19} />
              {n.label}
              {n.id === "tryout" && <span className="tiny-label">UTBK</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-promo">
          <div className="promo-icon">
            <Sparkles size={20} />
          </div>
          <strong>
            Selangkah lebih dekat
            <br />
            ke kampus impian.
          </strong>
          <p>Mulai dari mengenali kemampuanmu hari ini.</p>
          <button onClick={() => start("diagnostic")}>
            Cek kemampuan <ArrowUpRight size={15} />
          </button>
        </div>
        <div className="sidebar-footer">
          <span className="avatar">
            {user?.name.slice(0, 1).toUpperCase() || "S"}
          </span>
          <div>
            <strong>{user?.name || "Sobat LevelUP"}</strong>
            <small>{user?.grade || "Mode eksplorasi"}</small>
          </div>
          {user ? (
            <button
              className="icon-button"
              aria-label="Keluar"
              onClick={async () => {
                const d = await call({ action: "logout" });
                if (d) {
                  setAttempt(null);
                  localStorage.removeItem("levelup-attempt");
                  await refresh();
                  go("dashboard");
                }
              }}
            >
              <LogOut size={17} />
            </button>
          ) : (
            <button className="text-button" onClick={() => setAuth("login")}>
              Masuk
            </button>
          )}
        </div>
      </aside>
      <div className="main-wrap">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="menu-button icon-button"
              aria-label="Buka menu"
              onClick={() => setMobile(true)}
            >
              <Menu size={22} />
            </button>
            <span>Ruang belajar</span>
            <ChevronRight size={14} />
            <strong>
              {view === "exam"
                ? "Sesi belajar"
                : view === "result"
                  ? "Hasil sesi"
                  : nav.find((n) => n.id === view)?.label}
            </strong>
          </div>
          <div className="topbar-right">
            <span className="date">{date}</span>
            <span className="streak-pill">
              <Flame size={16} />
              {streak} hari streak
            </span>
            <button
              className="avatar small"
              onClick={() => (user ? go("progress") : setAuth("login"))}
              aria-label={user ? "Lihat profil progres" : "Masuk"}
            >
              {user?.name.slice(0, 1).toUpperCase() || "S"}
            </button>
          </div>
        </header>
        <main>
          {notice && !auth && (
            <div className="info-box" role="status">
              {notice}
              <button
                className="icon-button"
                aria-label="Tutup informasi"
                onClick={() => setNotice("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {error && (
            <div className="error" role="alert">
              {error}
              <button onClick={() => setError("")} aria-label="Tutup pesan">
                <X size={16} />
              </button>
            </div>
          )}
          {view === "dashboard" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">YOUR NEXT LEVEL STARTS HERE</div>
                  <h1>
                    {user
                      ? `Halo, ${user.name.split(" ")[0]}`
                      : "Halo, Sobat LevelUP"}{" "}
                    <span className="wave">✦</span>
                  </h1>
                  <p>
                    Langkah kecil hari ini, kemajuan nyata untuk UTBK nanti.
                  </p>
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
                    <br className="desktop" /> temukan yang perlu dilatih, dan
                    naik level bersama kami.
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
                  value={avg === null ? "—" : `${avg}%`}
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
                    <span className="muted small-text">
                      Dibuat untuk perjalananmu
                    </span>
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
                          : "Bangun fondasi kuat, satu konsep setiap kali."}
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
          )}
          {view === "learn" && (
            <>
              <PageHeading
                eyebrow="PAHAMI, BUKAN HAFALKAN"
                title="Belajar dengan arah"
                subtitle="7 modul belajar · 252 soal. Pilih konsep, pahami langkahnya, lalu buktikan pemahamanmu."
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
                {topics
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
              {!topics.some((t) =>
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
                      6 soal terbimbing: 2 Basic, 2 Medium, dan 2 Hard. Jika
                      salah, gunakan petunjuk dan coba sekali lagi.
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
                      5 soal · 10 menit · tanpa petunjuk. Lulus ≥80%, namun
                      mastery tetap memerlukan bukti yang cukup.
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
          )}
          {view === "practice" && (
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
                    Pilih bagian, subtopik, kesulitan, dan jumlah soal. Jawaban
                    pertama menjadi bukti kemampuanmu.
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
                      <option value="PU">PU — Penalaran Umum</option>
                    </select>
                  </label>
                  <label className="field">
                    Subtopik
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    >
                      {topics
                        .filter(
                          (t) => section === "All" || t.section === section,
                        )
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
                        if (e.target.value !== "Mixed" && count > 10)
                          setCount(10);
                      }}
                    >
                      <option value="Mixed">Campuran</option>
                      <option value="Basic">Basic — fondasi</option>
                      <option value="Medium">Medium — penerapan</option>
                      <option value="Hard">Hard — lebih menantang</option>
                    </select>
                  </label>
                  <label className="field">
                    Jumlah soal
                    <select
                      value={count}
                      onChange={(e) => setCount(Number(e.target.value))}
                    >
                      {(difficulty === "Mixed" ? [5, 10, 15, 20] : [5, 10]).map(
                        (n) => (
                          <option key={n}>{n}</option>
                        ),
                      )}
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
                    Minimal 5 jawaban latihan dihitung sebagai hari belajar
                    aktif.
                  </div>
                </section>
              </div>
            </>
          )}
          {view === "tryout" && (
            <>
              <PageHeading
                eyebrow="KENALI TITIK AWALMU"
                title="Siap mengukur kemampuan?"
                subtitle="Hasil tes adalah petunjuk untuk belajar, bukan batas kemampuanmu."
              />
              <div className="assessment-card panel">
                <div className="assessment-cover">
                  <Target size={75} />
                  <span>INITIAL SKILL PROFILE</span>
                  <h2>
                    Kenali dirimu.
                    <br />
                    Temukan arahmu.
                  </h2>
                  <span className="tag white-tag">PK · PM · PU</span>
                </div>
                <div className="assessment-info">
                  <span className="eyebrow purple-text">DIAGNOSTIK GRATIS</span>
                  <h2>
                    Langkah pertama menuju
                    <br />
                    persiapan yang lebih terarah.
                  </h2>
                  <p>
                    15 soal dari tujuh subtopik, seimbang PK/PM/PU. Tidak ada
                    petunjuk atau pembahasan selama tes. Jawaban tersimpan
                    setiap kali kamu memilih.
                  </p>
                  <div className="tag-row">
                    <span>15 soal</span>
                    <span>30 menit</span>
                    <span>Resume tersedia</span>
                  </div>
                  <div className="info-box">
                    Timer dimulai di server. Saat waktu habis, jawaban yang
                    tersimpan dinilai otomatis. Profil awal ini bukan estimasi
                    skor UTBK.
                  </div>
                  <button
                    className="button primary"
                    disabled={busy}
                    onClick={() => start("diagnostic")}
                  >
                    Mulai / lanjutkan diagnostik <ArrowRight size={17} />
                  </button>
                </div>
              </div>
              <p className="muted scope-note">
                Paket tryout kompetitif sedang disiapkan. Versi awal berfokus
                pada diagnostik, belajar, dan latihan.
              </p>
            </>
          )}
          {view === "progress" && (
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
                  Belum diukur berbeda dari nol. Mastered perlu mastery ≥80
                  serta bukti dan confidence yang cukup.
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
                              ? `${m.count} bukti soal · confidence ${Math.round(m.confidence * 100)}%`
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
                      Selesaikan diagnostik atau latihan untuk mulai mencatat
                      progres.
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
          )}
          {view === "exam" && attempt && q && (
            <>
              <div className="exam-heading">
                <div>
                  <span className="eyebrow purple-text">
                    {kindLabel[attempt.kind]} · {topicName(attempt.topic)}
                  </span>
                  <h1>Satu soal, satu langkah.</h1>
                </div>
                <span
                  className={`timer ${attempt.deadline && time < 120 ? "urgent" : ""}`}
                >
                  <Clock size={18} />
                  {attempt.deadline ? "Sisa waktu" : "Waktu berjalan"}{" "}
                  <strong>{timeText}</strong>
                </span>
              </div>
              <div className="exam-grid">
                <section className="panel question-panel">
                  <div className="section-heading">
                    <span className="muted">
                      Soal {index + 1} dari {attempt.questions.length}
                    </span>
                    <span className="tag">
                      {q.section} · {q.difficulty}
                    </span>
                  </div>
                  <div className="question-progress">
                    <span
                      style={{
                        width: `${((index + 1) / attempt.questions.length) * 100}%`,
                      }}
                    />
                  </div>
                  <h2 className="question-stem">{q.stem}</h2>
                  <div className="answer-options">
                    {q.options.map((o, i) => (
                      <button
                        aria-label={`Pilihan ${String.fromCharCode(65 + i)}: ${o}`}
                        className={`answer ${selected === i ? "chosen" : ""} ${q.correct === i ? "right" : ""}`}
                        key={i}
                        disabled={busy || !!feedback?.done}
                        onClick={async () => {
                          const d = await call({
                            action: "answer",
                            id: attempt.id,
                            questionId: q.id,
                            selected: i,
                          });
                          if (d) syncAttempt(d.attempt);
                        }}
                      >
                        <span>{String.fromCharCode(65 + i)}</span>
                        {o}
                        {selected === i && <CheckCircle2 size={19} />}
                      </button>
                    ))}
                  </div>
                  {busy && (
                    <div className="save-status" role="status">
                      Menyimpan…
                    </div>
                  )}
                  {selected !== undefined && !busy && (
                    <div className="save-status">
                      <Check size={13} />
                      Tersimpan di server
                    </div>
                  )}
                  {q.hint && (
                    <div className="hint">
                      <strong>Belum tepat. Coba sekali lagi.</strong>
                      <p>{q.hint}</p>
                    </div>
                  )}
                  {q.explanation && (
                    <div className="explanation">
                      <h3>
                        {feedback?.correct
                          ? "Tepat!"
                          : "Mari pahami langkahnya."}
                      </h3>
                      <strong>Langkah pertama</strong>
                      <p>{q.explanation.firstStep}</p>
                      <strong>Penyelesaian</strong>
                      <p>{q.explanation.solution}</p>
                      <small>Hindari: {q.explanation.mistake}</small>
                    </div>
                  )}
                  <div className="question-nav">
                    <button
                      className="button secondary"
                      disabled={index === 0 || busy}
                      onClick={() => setIndex((i) => i - 1)}
                    >
                      <ChevronLeft size={17} />
                      Sebelumnya
                    </button>
                    {index < attempt.questions.length - 1 ? (
                      <button
                        className="button primary"
                        disabled={
                          busy ||
                          ((attempt.kind === "guided" ||
                            attempt.kind === "practice") &&
                            !feedback?.done)
                        }
                        onClick={() => setIndex((i) => i + 1)}
                      >
                        Berikutnya
                        <ChevronRight size={17} />
                      </button>
                    ) : (
                      <button
                        className="button primary"
                        disabled={busy}
                        onClick={() => setConfirm(true)}
                      >
                        Selesaikan sesi
                        <Check size={17} />
                      </button>
                    )}
                  </div>
                </section>
                <aside className="panel exam-sidebar">
                  <h3>Navigasi soal</h3>
                  <div className="question-dots">
                    {attempt.questions.map((item, i) => (
                      <button
                        aria-label={`Buka soal ${i + 1}`}
                        className={`${attempt.answers[item.id] !== undefined ? "answered" : ""} ${index === i ? "current" : ""}`}
                        onClick={() => setIndex(i)}
                        key={item.id}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <p className="muted small-text">
                    {answered}/{attempt.questions.length} jawaban tersimpan
                  </p>
                  <div className="info-box">
                    {attempt.kind === "diagnostic" || attempt.kind === "mini"
                      ? "Tidak ada petunjuk atau umpan balik selama asesmen. Kamu bisa meninjau jawaban sebelum mengirim."
                      : "Baca pembahasan sebelum melanjutkan. Jawaban latihan mandiri tidak bisa diulang."}
                  </div>
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={() => setConfirm(true)}
                  >
                    Selesaikan sesi
                  </button>
                  <button
                    className="text-button"
                    onClick={() => go("dashboard")}
                  >
                    Simpan & kembali
                  </button>
                </aside>
              </div>
            </>
          )}
          {view === "result" && attempt?.result && (
            <>
              <PageHeading
                eyebrow="LANGKAH PERTAMA SUDAH TERLEWATI"
                title={
                  attempt.kind === "diagnostic"
                    ? "Profil kemampuan awalmu"
                    : "Satu langkah maju. Kerja bagus!"
                }
                subtitle={
                  attempt.kind === "diagnostic"
                    ? "Ini titik awal, bukan kesimpulan mutlak. Gunakan hasilnya untuk memilih langkah belajar berikutnya."
                    : "Nilai sesi dan bukti mastery adalah dua ukuran berbeda."
                }
              />
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
              <div className="result-topics">
                {topics
                  .filter((t) =>
                    attempt.questions.some((q) => q.topic === t.id),
                  )
                  .map((t) => {
                    const qs = attempt.questions.filter(
                        (q) => q.topic === t.id,
                      ),
                      c = qs.filter(
                        (q) => attempt.answers[q.id] === q.correct,
                      ).length;
                    return (
                      <div className="panel" key={t.id}>
                        <span className="tag">
                          {c / qs.length >= 0.8
                            ? "Kekuatan awal"
                            : "Perlu diperkuat"}
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
              <div className="result-actions">
                <button
                  className="button primary"
                  onClick={() => {
                    setTopic(attempt.topic || recommended);
                    go("learn");
                  }}
                >
                  Lanjut belajar <ArrowRight size={17} />
                </button>
                <button
                  className="button secondary"
                  onClick={() => go("progress")}
                >
                  Lihat progres
                </button>
              </div>
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
            </>
          )}
          {!ready && (
            <div className="loading-note" role="status">
              Memuat ruang belajarmu…
            </div>
          )}
        </main>
      </div>
      {auth && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
          >
            <button
              className="modal-close icon-button"
              aria-label="Tutup"
              onClick={() => {
                setAuth(null);
                setError("");
              }}
            >
              <X size={20} />
            </button>
            <span className="icon-tile purple">
              <GraduationCap size={26} />
            </span>
            <h2 id="auth-title">
              {auth === "register"
                ? "Mulai perjalananmu."
                : auth === "confirmation"
                  ? "Konfirmasi email terlebih dahulu"
                  : "Selamat datang kembali."}
            </h2>
            <p className="muted">
              {notice ||
                "Simpan progres dan temukan langkah belajar yang tepat."}
            </p>
            {auth === "confirmation" ? (
              <div>
                <ol>
                  <li>Buka email dari Supabase, termasuk folder spam.</li>
                  <li>Klik tautan konfirmasi email.</li>
                  <li>Kembali ke aplikasi dan masuk dengan akun Anda.</li>
                </ol>
                <button
                  className="button primary full"
                  onClick={() => {
                    setAuth("login");
                    setError("");
                  }}
                >
                  Sudah konfirmasi? Masuk
                </button>
              </div>
            ) : (
              <>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const data = Object.fromEntries(
                      new FormData(e.currentTarget),
                    );
                    const d = await call({ action: auth, ...data });
                    if (d) {
                      if (d.confirmationRequired) {
                        sessionStorage.setItem(
                          "levelup-email-confirmation",
                          "pending",
                        );
                        setAuth("confirmation");
                        setNotice(
                          "Pendaftaran diterima. Anda belum masuk; konfirmasi email diperlukan sebelum latihan.",
                        );
                      } else {
                        sessionStorage.removeItem("levelup-email-confirmation");
                        setAuth(null);
                        setNotice("");
                      }
                      await refresh();
                    }
                  }}
                >
                  {auth === "register" && (
                    <label className="field">
                      Nama lengkap
                      <input
                        name="name"
                        required
                        minLength={2}
                        maxLength={80}
                        autoComplete="name"
                        placeholder="Nama kamu"
                      />
                    </label>
                  )}
                  <label className="field">
                    Email
                    <input
                      name="email"
                      required
                      type="email"
                      autoComplete="email"
                      placeholder="kamu@email.com"
                    />
                  </label>
                  <label className="field">
                    Kata sandi
                    <input
                      name="password"
                      required
                      type="password"
                      minLength={auth === "register" ? 8 : 1}
                      maxLength={200}
                      autoComplete={
                        auth === "register"
                          ? "new-password"
                          : "current-password"
                      }
                      placeholder="Minimal 8 karakter"
                    />
                  </label>
                  {auth === "register" && (
                    <div className="form-row">
                      <label className="field">
                        Jenjang
                        <select name="grade">
                          <option>Kelas 12</option>
                          <option>Kelas 11</option>
                          <option>Gap year</option>
                        </select>
                      </label>
                      <label className="field">
                        Target UTBK
                        <input
                          name="goal"
                          type="number"
                          min="100"
                          max="1000"
                          defaultValue="700"
                          required
                        />
                      </label>
                    </div>
                  )}
                  {error && (
                    <p className="form-error" role="alert">
                      {error}
                    </p>
                  )}
                  <button className="button primary full" disabled={busy}>
                    {busy
                      ? "Memproses…"
                      : auth === "register"
                        ? "Buat akun"
                        : "Masuk"}
                    <ArrowRight size={17} />
                  </button>
                </form>
                <button
                  className="text-button auth-toggle"
                  onClick={() => {
                    setAuth(auth === "register" ? "login" : "register");
                    setError("");
                  }}
                >
                  {auth === "register"
                    ? "Sudah punya akun? Masuk"
                    : "Belum punya akun? Daftar gratis"}
                </button>
              </>
            )}
            <div className="demo-label">
              {backend === "supabase"
                ? "Akun online dikelola melalui Supabase."
                : "Versi pengembangan · akun tersimpan lokal di server ini."}
              <br />
              {backend === "supabase"
                ? "Jika diminta, konfirmasikan email sebelum masuk."
                : "Gunakan kata sandi khusus untuk mencoba aplikasi."}
            </div>
          </section>
        </div>
      )}
      {confirm && attempt && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="submit-title"
          >
            <h2 id="submit-title">Selesaikan sesi?</h2>
            <p>
              {answered} dari {attempt.questions.length} soal tersimpan.{" "}
              {attempt.questions.length - answered > 0
                ? "Soal yang kosong akan dicatat sebagai belum dijawab."
                : "Kamu sudah menjawab semua soal."}
            </p>
            <p className="muted">
              Setelah dikirim, jawaban tidak dapat diubah.
            </p>
            {error && <p className="form-error">{error}</p>}
            <div className="question-nav">
              <button
                className="button secondary"
                onClick={() => setConfirm(false)}
              >
                Periksa lagi
              </button>
              <button
                className="button primary"
                disabled={busy}
                onClick={() => void submit()}
              >
                Kirim jawaban
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
function Stat({
  icon,
  label,
  value,
  foot,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  foot: string;
  color: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <span className={`stat-icon ${color}`}>{icon}</span>
      </div>
      <strong className="stat-value">{value}</strong>
      <p>{foot}</p>
    </div>
  );
}
function PageHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}
