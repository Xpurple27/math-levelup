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
  return Number.isInteger(value) ? `${value} menit` : `${value.toFixed(1).replace(".", ",")} menit`;
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
        if (!response.ok) throw new Error(json.error || "Tryout gagal dimuat.");
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
      else map.set(item.suiteCode, { title: item.suiteTitle, sections: [item] });
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
        {[0, 1].map((item) => <div key={item} className="h-[420px] animate-pulse rounded-3xl bg-[#f4eeee]" />)}
      </div>
    );
  }
  if (error) return <div className="rounded-2xl border border-[#efcdd0] bg-[#fff4f4] p-5 text-sm font-semibold text-[#8f1d24]">{error}</div>;
  if (!suites.length) return <div className="rounded-2xl border border-[#eadfe0] bg-white p-6 text-sm text-[#806d6f]">Belum ada Mini Tryout yang dipublikasikan.</div>;

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {suites.map((suite, suiteIndex) => {
        const totalQuestions = suite.sections.reduce((sum, item) => sum + item.questionCount, 0);
        const totalSeconds = suite.sections.reduce((sum, item) => sum + item.durationSeconds, 0);
        return (
          <article key={suite.code} className="overflow-hidden rounded-3xl border border-[#e5d7d8] bg-white shadow-sm">
            <div className="border-b border-[#efe4e5] bg-[linear-gradient(135deg,#fff7f4_0%,#fff_55%,#fff7df_100%)] p-6 md:p-7">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-[#8f1d24] px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-white">Mini Tryout {String(suiteIndex + 1).padStart(2, "0")}</span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-[#60755c]"><ShieldCheck size={15} /> Gratis</span>
              </div>
              <h2 className="mt-4 text-2xl font-black tracking-[-0.02em] text-[#302426]">{suite.title}</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#796668]">Simulasi untuk tiga section yang sudah tersedia di LevelUP. Jumlah soal dan timer setiap section mengikuti framework SNBT 2026.</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-extrabold text-[#6f5a5d]">
                <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm"><Target size={14} /> {totalQuestions} soal</span>
                <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm"><Clock3 size={14} /> {minutes(totalSeconds)} total</span>
                <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm"><Gauge size={14} /> timer per section</span>
              </div>
            </div>

            <div className="space-y-3 p-5 md:p-6">
              {suite.sections.map((item, index) => (
                <div key={item.id} className="rounded-2xl border border-[#eee3e4] bg-[#fffdfc] p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fff0ee] text-xs font-black text-[#9e2027]">{index + 1}</span>
                        <span className="text-xs font-black uppercase tracking-[0.12em] text-[#a52b31]">{item.section.code}</span>
                      </div>
                      <h3 className="mt-2 text-base font-extrabold text-[#35292b]">{item.title}</h3>
                      <p className="mt-1 text-xs leading-5 text-[#846f71]">{item.description}</p>
                      <div className="mt-2 flex gap-3 text-xs font-bold text-[#6f5d5f]">
                        <span>{item.questionCount} soal</span><span>•</span><span>{minutes(item.durationSeconds)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={busy || item.access !== "FREE"}
                      onClick={() => void start("tryout", item.slug)}
                      className="flex shrink-0 items-center justify-between gap-3 rounded-xl bg-[#8f1d24] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#74161c] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Mulai {item.section.code}<ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
              <p className="px-1 pt-1 text-[11px] leading-5 text-[#978184]">Timer dimulai saat section dibuka dan tetap berjalan sampai dikumpulkan atau waktu habis. Pembahasan muncul setelah section selesai.</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
