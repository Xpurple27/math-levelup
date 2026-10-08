"use client";
import { ReportIssue } from "./levelup/report-issue";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import {
  ArrowUpRight,
  BookOpen,
  ChartNoAxesCombined,
  ChevronRight,
  Flame,
  Grid2X2,
  LogOut,
  Menu,
  Sparkles,
  Target,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { useTopics } from "./content-context";
import type { Mastery } from "@/lib/scoring";
import type { View, User, Attempt, History } from "./levelup/types";
import { SubmitDialog } from "./levelup/submit-view";
import { AuthDialog } from "./levelup/auth-view";
import { ResultView } from "./levelup/result-view";
import { ExamView } from "./levelup/exam-view";
import { ProgressView } from "./levelup/progress-view";
import { TryoutView } from "./levelup/tryout-view";
import { PracticeView } from "./levelup/practice-view";
import { LearnView } from "./levelup/learn-view";
import { DashboardView } from "./levelup/dashboard-view";
const nav = [
  { id: "dashboard", label: "Beranda", icon: Grid2X2 },
  { id: "learn", label: "Belajar", icon: BookOpen },
  { id: "practice", label: "Latihan", icon: Zap },
  { id: "tryout", label: "Tryout", icon: Target },
  { id: "progress", label: "Progres", icon: ChartNoAxesCombined },
] as const;
export default function Levelup() {
  const topics = useTopics();
  const [user, setUser] = useState<User | null>(null),
    [ready, setReady] = useState(false),
    [view, setView] = useState<View>("dashboard"),
    [mastery, setMastery] = useState<Mastery[]>([]),
    [history, setHistory] = useState<History[]>([]),
    [streak, setStreak] = useState(0),
    [days, setDays] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState("Mixed");
  const [section, setSection] = useState("All");
  const [resultTab, setResultTab] = useState("result");
  const [backend, setBackend] = useState<"local" | "supabase">("local");
  const [auth, setAuth] = useState<
      "login" | "register" | "confirmation" | null
    >(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [topic, setTopic] = useState(topics[0]?.id || ""),
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
      setResultTab("result");
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
      section,
      ...(kind === "tryout" ? { packageSlug: t } : {}),
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
  const recommended = weakest?.topic || topics[0]?.id || "";
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
            <DashboardView
              user={user}
              busy={busy}
              start={start}
              history={history}
              avg={avg}
              solved={solved}
              streak={streak}
              weakest={weakest}
              recommended={recommended}
              setTopic={setTopic}
              go={go}
            />
          )}
          {view === "learn" && <LearnView />}
          {view === "practice" && (
            <PracticeView
              section={section}
              setSection={setSection}
              topic={topic}
              setTopic={setTopic}
              difficulty={difficulty}
              setDifficulty={setDifficulty}
              count={count}
              setCount={setCount}
              busy={busy}
              start={start}
              recommended={recommended}
              weakest={weakest}
            />
          )}
          {view === "tryout" && (
            <TryoutView
              history={history}
              busy={busy}
              start={start}
              syncAttempt={syncAttempt}
              setView={setView}
              setError={setError}
            />
          )}
          {view === "progress" && (
            <ProgressView
              avg={avg}
              solved={solved}
              streak={streak}
              days={days}
              history={history}
              mastery={mastery}
              start={start}
              syncAttempt={syncAttempt}
              setView={setView}
            />
          )}
          {view === "exam" && attempt && q && (
            <ExamView
              attempt={attempt}
              time={time}
              timeText={timeText}
              index={index}
              q={q}
              selected={selected}
              busy={busy}
              feedback={feedback}
              call={call}
              syncAttempt={syncAttempt}
              setIndex={setIndex}
              setConfirm={setConfirm}
              answered={answered}
              go={go}
            />
          )}
          {view === "result" && attempt?.result && (
            <ResultView
              attempt={attempt}
              resultTab={resultTab}
              setResultTab={setResultTab}
              setTopic={setTopic}
              go={go}
              recommended={recommended}
            />
          )}
          {!ready && (
            <div className="loading-note" role="status">
              Memuat ruang belajarmu…
            </div>
          )}
          {user &&
            [
              "dashboard",
              "learn",
              "progress",
              "result",
              "practice",
              "tryout",
            ].includes(view) && (
              <ReportIssue
                key={`${view}-${topic}-${view === "result" ? attempt?.id : ""}`}
                view={view}
                attemptId={view === "result" ? attempt?.id : undefined}
                topic={
                  view === "learn" || view === "practice" ? topic : undefined
                }
              />
            )}
        </main>
      </div>
      {auth && (
        <AuthDialog
          setAuth={setAuth}
          setError={setError}
          auth={auth}
          notice={notice}
          call={call}
          setNotice={setNotice}
          refresh={refresh}
          error={error}
          busy={busy}
          backend={backend}
        />
      )}
      {confirm && attempt && (
        <SubmitDialog
          answered={answered}
          attempt={attempt}
          error={error}
          setConfirm={setConfirm}
          busy={busy}
          submit={submit}
        />
      )}
    </div>
  );
}
