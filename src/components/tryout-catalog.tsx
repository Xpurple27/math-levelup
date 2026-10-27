"use client";

import { useEffect, useMemo, useState } from "react";
import { useBrowserStorage, writeBrowserStorage } from "./use-browser-storage";
import { ArrowRight, Clock3, ShieldCheck, Target, Trophy } from "lucide-react";

type TryoutPackage = {
  id: string;
  code: string;
  slug: string;
  suiteCode: string;
  suiteTitle: string;
  title: string;
  description: string;
  access: "FREE" | "PREMIUM";
  questionCount: number;
  durationSeconds: number;
  sectionOrder: number;
  section: { id: string; code: string; name: string };
};

type Props = {
  userId: string;
  busy: boolean;
  start: (kind: string, topic?: string) => Promise<void>;
};

type SuiteStats = Record<string, { attempts: number; bestScore: number }>;

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

const RUN_KEY = "vectra-mini-tryout-run";
const STATS_KEY = "vectra-mini-tryout-stats";

function minutes(seconds: number) {
  const value = seconds / 60;
  return Number.isInteger(value)
    ? `${value} menit`
    : `${value.toFixed(1).replace(".", ",")} menit`;
}

export function TryoutCatalog({ userId, busy, start }: Props) {
  const runKey = `${RUN_KEY}:${userId}`;
  const statsKey = `${STATS_KEY}:${userId}`;
  const [items, setItems] = useState<TryoutPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const statsRaw = useBrowserStorage(statsKey);
  let stats: SuiteStats = {};
  try {
    stats = JSON.parse(statsRaw || "{}");
  } catch {
    /* Optional browser summary. */
  }

  useEffect(() => {
    let alive = true;
    fetch("/api/tryout-packages", { cache: "no-store" })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok)
          throw new Error(json.error || "Assessment gagal dimuat.");
        if (alive) setItems((json.data || []) as TryoutPackage[]);
      })
      .catch((reason: Error) => alive && setError(reason.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const suites = useMemo(() => {
    const map = new Map<string, { title: string; sections: TryoutPackage[] }>();
    for (const item of items) {
      const current = map.get(item.suiteCode);
      if (current) current.sections.push(item);
      else
        map.set(item.suiteCode, { title: item.suiteTitle, sections: [item] });
    }
    return [...map.entries()].map(([code, value]) => ({
      code,
      title: value.title,
      sections: value.sections.sort((a, b) => a.sectionOrder - b.sectionOrder),
    }));
  }, [items]);

  async function startSuite(suite: (typeof suites)[number]) {
    const existing = (() => {
      try {
        return JSON.parse(
          localStorage.getItem(runKey) || "null",
        ) as SuiteRun | null;
      } catch {
        return null;
      }
    })();

    if (existing && existing.suiteCode === suite.code && !existing.completed) {
      const resumeIndex = Math.min(
        existing.currentIndex,
        existing.sectionSlugs.length - 1,
      );
      await start("tryout", existing.sectionSlugs[resumeIndex]);
      return;
    }

    const previous = stats[suite.code]?.attempts || 0;
    const run: SuiteRun = {
      suiteCode: suite.code,
      suiteTitle: suite.title,
      attemptNo: previous + 1,
      sectionSlugs: suite.sections.map((item) => item.slug),
      sectionCodes: suite.sections.map((item) => item.section.code),
      currentIndex: 0,
      results: {},
    };
    writeBrowserStorage(runKey, JSON.stringify(run));
    await start("tryout", run.sectionSlugs[0]);
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1].map((item) => (
          <div
            key={item}
            className="h-64 animate-pulse rounded-3xl bg-[#eef1f5]"
          />
        ))}
      </div>
    );
  }
  if (error)
    return (
      <div className="rounded-2xl border border-[#f1cfd4] bg-[#fff5f6] p-5 text-sm font-semibold text-[#b83848]">
        {error}
      </div>
    );
  if (!suites.length)
    return (
      <div className="rounded-2xl border border-[#dfe4ec] bg-white p-6 text-sm text-[#697386]">
        Belum ada VECTRA Assessment yang dipublikasikan.
      </div>
    );

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:gap-5">
      {suites.map((suite, suiteIndex) => {
        const totalQuestions = suite.sections.reduce(
          (sum, item) => sum + item.questionCount,
          0,
        );
        const totalSeconds = suite.sections.reduce(
          (sum, item) => sum + item.durationSeconds,
          0,
        );
        const currentStats = stats[suite.code];
        return (
          <article
            key={suite.code}
            className="flex min-w-0 flex-col overflow-hidden rounded-[24px] border border-[#dfe4ec] bg-white shadow-[0_10px_30px_rgba(11,16,32,0.045)]"
          >
            <div className="bg-[linear-gradient(135deg,#f1f5ff_0%,#ffffff_54%,#f4ffe4_100%)] p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-[#0b1020] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.13em] text-white">
                  Mini Tryout {String(suiteIndex + 1).padStart(2, "0")}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#14705f]">
                  <ShieldCheck size={14} /> Gratis
                </span>
              </div>
              <h2 className="mt-4 text-[22px] font-black tracking-[-0.025em] text-[#11182b]">
                {suite.title}
              </h2>
              <p className="mt-2 text-[13px] leading-6 text-[#697386]">
                Satu paket utuh: PU → PK → PM. Timer tetap berjalan per subtes,
                dan kamu melanjutkan section berikutnya setelah section
                sebelumnya selesai.
              </p>
            </div>

            <div className="flex flex-1 flex-col p-5 sm:p-6">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-[#f7f8fa] p-3">
                  <Target size={15} className="text-[#5c7cfa]" />
                  <strong className="mt-2 block text-sm text-[#11182b]">
                    {totalQuestions}
                  </strong>
                  <span className="text-[10px] font-semibold text-[#7a8496]">
                    soal
                  </span>
                </div>
                <div className="rounded-xl bg-[#f7f8fa] p-3">
                  <Clock3 size={15} className="text-[#00a98f]" />
                  <strong className="mt-2 block text-sm text-[#11182b]">
                    {minutes(totalSeconds)}
                  </strong>
                  <span className="text-[10px] font-semibold text-[#7a8496]">
                    total
                  </span>
                </div>
                <div className="rounded-xl bg-[#f7f8fa] p-3">
                  <Trophy size={15} className="text-[#7c9b19]" />
                  <strong className="mt-2 block text-sm text-[#11182b]">
                    {currentStats ? `${currentStats.bestScore}%` : "—"}
                  </strong>
                  <span className="text-[10px] font-semibold text-[#7a8496]">
                    best
                  </span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {suite.sections.map((item) => (
                  <span
                    key={item.id}
                    className="rounded-full border border-[#dfe4ec] bg-white px-2.5 py-1 text-[10px] font-bold text-[#596477]"
                  >
                    {item.section.code} · {item.questionCount} ·{" "}
                    {minutes(item.durationSeconds)}
                  </span>
                ))}
              </div>

              {currentStats && (
                <p className="mt-4 text-xs font-semibold text-[#697386]">
                  Sudah {currentStats.attempts} percobaan · nilai terbaik{" "}
                  {currentStats.bestScore}%
                </p>
              )}

              <button
                type="button"
                disabled={
                  busy || suite.sections.some((item) => item.access !== "FREE")
                }
                onClick={() => void startSuite(suite)}
                className="mt-5 flex min-h-12 w-full items-center justify-between rounded-xl bg-[#0b1020] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#18233e] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Mulai Mini Tryout ↗ <ArrowRight size={16} />
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
