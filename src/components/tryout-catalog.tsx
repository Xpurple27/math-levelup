"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock3, Gauge, ShieldCheck, Target } from "lucide-react";

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
  busy: boolean;
  start: (kind: string, topic?: string) => Promise<void>;
};

function minutes(seconds: number) {
  const value = seconds / 60;
  return Number.isInteger(value)
    ? `${value} menit`
    : `${value.toFixed(1).replace(".", ",")} menit`;
}

export function TryoutCatalog({ busy, start }: Props) {
  const [items, setItems] = useState<TryoutPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    const map = new Map<
      string,
      { title: string; sections: TryoutPackage[] }
    >();
    for (const item of items) {
      const current = map.get(item.suiteCode);
      if (current) current.sections.push(item);
      else
        map.set(item.suiteCode, {
          title: item.suiteTitle,
          sections: [item],
        });
    }
    return [...map.entries()].map(([code, value]) => ({
      code,
      title: value.title,
      sections: value.sections.sort((a, b) => a.sectionOrder - b.sectionOrder),
    }));
  }, [items]);

  if (loading) {
    return (
      <div className="grid gap-5 lg:grid-cols-2">
        {[0, 1].map((item) => (
          <div
            key={item}
            className="h-[420px] animate-pulse rounded-3xl bg-[#eef1f5]"
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
    <div className="grid min-w-0 gap-5 xl:grid-cols-2">
      {suites.map((suite, suiteIndex) => {
        const totalQuestions = suite.sections.reduce(
          (sum, item) => sum + item.questionCount,
          0,
        );
        const totalSeconds = suite.sections.reduce(
          (sum, item) => sum + item.durationSeconds,
          0,
        );
        return (
          <article
            key={suite.code}
            className="min-w-0 overflow-hidden rounded-3xl border border-[#dfe4ec] bg-white shadow-sm"
          >
            <div className="border-b border-[#dfe4ec] bg-[linear-gradient(135deg,#eef2ff_0%,#fff_52%,#f3ffde_100%)] p-6 md:p-7">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-[#0b1020] px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-white">
                  Mini Assessment {String(suiteIndex + 1).padStart(2, "0")}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-[#17745f]">
                  <ShieldCheck size={15} /> Gratis
                </span>
              </div>
              <h2 className="mt-4 text-2xl font-black tracking-[-0.02em] text-[#11182b]">
                {suite.title}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#697386]">
                Assessment untuk tiga section yang tersedia di VECTRA Math.
                Jumlah soal dan timer tiap section mengikuti blueprint yang sudah
                ditetapkan.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-extrabold text-[#596477]">
                <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm">
                  <Target size={14} /> {totalQuestions} soal
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm">
                  <Clock3 size={14} /> {minutes(totalSeconds)} total
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm">
                  <Gauge size={14} /> timer per section
                </span>
              </div>
            </div>

            <div className="p-5 md:p-6">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#7a8496] md:hidden">
                Geser untuk melihat semua section ↔
              </p>
              <div className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:block md:space-y-3 md:overflow-visible md:px-0 md:pb-0">
                {suite.sections.map((item, index) => (
                  <div
                    key={item.id}
                    className="w-[82vw] max-w-[360px] shrink-0 snap-start rounded-2xl border border-[#dfe4ec] bg-[#fbfcfe] p-4 md:w-auto md:max-w-none"
                  >
                    <div className="flex h-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e9fbf7] text-xs font-black text-[#0b7f6d]">
                            {index + 1}
                          </span>
                          <span className="text-xs font-black uppercase tracking-[0.12em] text-[#405fd6]">
                            {item.section.code}
                          </span>
                        </div>
                        <h3 className="mt-2 text-base font-extrabold text-[#11182b]">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-[#697386]">
                          {item.description}
                        </p>
                        <div className="mt-2 flex gap-3 text-xs font-bold text-[#596477]">
                          <span>{item.questionCount} soal</span>
                          <span>•</span>
                          <span>{minutes(item.durationSeconds)}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={busy || item.access !== "FREE"}
                        onClick={() => void start("tryout", item.slug)}
                        className="flex w-full shrink-0 items-center justify-between gap-3 rounded-xl bg-[#0b1020] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#18233e] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                      >
                        Start {item.section.code} ↗ <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="px-1 pt-3 text-[11px] leading-5 text-[#7a8496]">
                Timer berjalan sejak section dibuka sampai dikumpulkan atau waktu
                habis. Pembahasan tersedia setelah section selesai.
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
