"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  ChartNoAxesCombined,
  Flame,
  Home,
  LogOut,
  Target,
  Zap,
} from "lucide-react";
import { ReportIssue } from "./levelup/report-issue";
import { useTopics } from "./content-context";
import type { Mastery } from "@/lib/scoring";
import type { View, User, Attempt, History } from "./levelup/types";
import { SubmitDialog } from "./levelup/submit-view";
import { ResultView } from "./levelup/result-view";
import { ExamView } from "./levelup/exam-view";
import { ProgressView } from "./levelup/progress-view";
import { TryoutView } from "./levelup/tryout-view";
import { PracticeView } from "./levelup/practice-view";
import { LearnView } from "./levelup/learn-view";
import { DashboardView } from "./levelup/dashboard-view";

const nav = [
  { id: "dashboard", label: "Beranda", icon: Home },
  { id: "learn", label: "Belajar", icon: BookOpen },
  { id: "practice", label: "Latihan", icon: Zap },
  { id: "tryout", label: "Tryout", icon: Target },
  { id: "progress", label: "Progres", icon: ChartNoAxesCombined },
] as const;

export default function Levelup() {
  const topics = useTopics();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>("dashboard");
  const [mastery, setMastery] = useState<Mastery[]>([]);
  const [history, setHistory] = useState<History[]>([]);
  const [streak, setStreak] = useState(0);
  const [days, setDays] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState("Mixed");
  const [section, setSection] = useState("All");
  const [resultTab, setResultTab] = useState("result");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [topic, setTopic] = useState(topics[0]?.id || "");
  const [count, setCount] = useState(5);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [index, setIndex] = useState(0);
  const [clock, setClock] = useState(() => Date.now());
  const [offset, setOffset] = useState(0);
  const [confirm, setConfirm] = useState(false);

  const refresh = useCallback(async () => {
    const r = await fetch("/api/action", { cache: "no-store" });
    const d = await r.json();
    setUser(d.user);
    setMastery(d.mastery || []);
    setHistory(d.history || []);
    setStreak(d.streak || 0);
    setDays(d.days || []);
    if (d.notice) setError(d.notice);
    setReady(true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(timer);
  }, [refresh]);

  useEffect(() => {
    if (ready && !user) window.location.replace("/login");
  }, [ready, user]);

  useEffect(() => {
    if (!user) return;
    const id = localStorage.getItem("levelup-attempt");
    if (!id) return;
    fetch(`/api/action?attempt=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.attempt) {
          setAttempt(d.attempt);
          setOffset(d.attempt.serverNow - Date.now());
          setView(d.attempt.status === "completed" ? "result" : "exam");
          if (d.attempt.status === "completed") localStorage.removeItem("levelup-attempt");
        } else {
          localStorage.removeItem("levelup-attempt");
        }
      });
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
      } else {
        localStorage.setItem("levelup-attempt", a.id);
      }
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
    setError("");
  };

  const start = async (kind: string, t = topic) => {
    if (!user) {
      window.location.assign("/login");
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

  async function logout() {
    const d = await call({ action: "logout" });
    if (!d) return;
    setAttempt(null);
    localStorage.removeItem("levelup-attempt");
    window.location.replace("/?signed_out=1");
  }

  const weakest = [...mastery].sort((a, b) => a.value - b.value || a.confidence - b.confidence)[0];
  const recommended = weakest?.topic || topics[0]?.id || "";
  const avg = mastery.length ? Math.round(mastery.reduce((s, m) => s + m.value, 0) / mastery.length) : null;
  const solved = history.reduce((s, h) => s + h.result.total - h.result.unanswered, 0);
  const q = attempt?.questions[index];
  const feedback = q && attempt?.feedback[q.id];
  const selected = q ? (attempt?.answers[q.id] ?? feedback?.selected) : undefined;
  const answered = attempt ? Object.keys(attempt.answers).length : 0;
  const time = attempt
    ? Math.max(
        0,
        Math.floor(
          (attempt.deadline ? attempt.deadline - clock - offset : clock + offset - attempt.started) / 1000,
        ),
      )
    : 0;
  const timeText = `${Math.floor(time / 60).toString().padStart(2, "0")}:${(time % 60).toString().padStart(2, "0")}`;

  return (
    <div className={`app-shell ${view === "exam" ? "student-exam-mode" : ""}`}>
      {view !== "exam" && (
        <header className="student-header">
          <div className="student-header-inner">
            <Link className="public-brand" href="/app" aria-label="LevelUP Math ruang siswa">
              <span className="public-brand-mark">LU</span>
              <span>LevelUP <small>Math</small></span>
            </Link>
            <nav className="student-nav" aria-label="Ruang siswa">
              {nav.map((item) => (
                <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => go(item.id)}>
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="student-header-actions">
              <span className="student-streak"><Flame size={15} /> {streak} hari</span>
              <button className="student-avatar" onClick={() => go("progress")} aria-label="Buka progres">
                {user?.name.slice(0, 1).toUpperCase() || "S"}
              </button>
              <button className="student-logout" onClick={() => void logout()} aria-label="Keluar dari akun" disabled={busy}>
                <LogOut size={17} />
              </button>
            </div>
          </div>
        </header>
      )}

      <main className="student-main" id="content">
        {error && (
          <div className="error" role="alert">
            {error}
            <button onClick={() => setError("")} aria-label="Tutup pesan">×</button>
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
        {!ready && <div className="loading-note" role="status">Memuat ruang belajarmu…</div>}
        {user && ["dashboard", "learn", "progress", "result", "practice", "tryout"].includes(view) && (
          <ReportIssue
            key={`${view}-${topic}-${view === "result" ? attempt?.id : ""}`}
            view={view}
            attemptId={view === "result" ? attempt?.id : undefined}
            topic={view === "learn" || view === "practice" ? topic : undefined}
          />
        )}
      </main>

      {view !== "exam" && (
        <nav className="student-mobile-nav" aria-label="Navigasi mobile siswa">
          {nav.map((item) => (
            <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => go(item.id)}>
              <item.icon size={17} />
              {item.label}
            </button>
          ))}
        </nav>
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
