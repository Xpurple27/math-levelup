"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Clock3,
  Gauge,
  ShieldCheck,
  Target,
} from "lucide-react";

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
        if (!response.ok) {
          throw new Error(json.error || "Assessment gagal dimuat.");
        }
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
      else {
        map.set(item.suiteCode, {
          title: item.suiteTitle,
          sections: [item],
        });
      }
    }

    return [...map.entries()].map(([code, value]) => ({
      code,
      title: value.title,
      sections: value.sections.sort((a, b) => a.sectionOrder - b.sectionOrder),
    }));
  }, [items]);

  if (loading) {
    return (
      <div className="space-y-5">
        {[0, 1].map((item) => (
          <div
            key={item}
            className="h-[360px] animate-pulse rounded-[28px] bg-[#eef1f5]"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-[#f1cfd4] bg-[#fff5f6] p-5 text-sm font-semibold text-[#b83848]">
        {error}
      </div>
    );
  }

  if (!suites.length) {
    return (
      <div className="rounded-2xl border border-[#dfe4ec] bg-white p-6 text-sm text-[#697386]">
        Belum ada VECTRA Assessment yang dipublikasikan.
      </div>
    );
  }

  return (
    <div className="space-y-5 md:space-y-6">
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
            className="overflow-hidden rounded-[24px] border border-[#dfe4ec] bg-white shadow-[0_12px_35px_rgba(11,16,32,0.05)] md:rounded-[28px]"
          >
            <div className="grid gap-5 border-b border-[#e5e9f0] bg-[linear-gradient(125deg,#f0f4ff_0%,#ffffff_50%,#f5ffe7_100%)] px-5 py-5 sm:px-6 md:grid-cols-[1fr_auto] md:items-end md:px-7 md:py-6 lg:px-8">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center rounded-full bg-[#0b1020] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.13em] text-white sm:text-[11px]">
                    Mini Assessment {String(suiteIndex + 1).padStart(2, "0")}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ccefe7] bg-[#effbf8] px-2.5 py-1.5 text-[10px] font-extrabold text-[#14705f] sm:text-[11px]">
                    <ShieldCheck size={14} /> Gratis
                  </span>
                </div>

                <h2 className="mt-4 text-[22px] font-black leading-tight tracking-[-0.025em] text-[#11182b] sm:text-2xl md:text-[26px]">
                  {suite.title}
                </h2>
                <p className="mt-2 max-w-3xl text-[13px] leading-6 text-[#697386] sm:text-sm">
                  Kerjakan PK, PM, dan PU sebagai section terpisah. Setiap section
                  memiliki timer sendiri dan pembahasan dibuka setelah selesai.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 md:min-w-[300px]">
                <div className="rounded-xl border border-white/80 bg-white/90 px-3 py-3 shadow-sm">
                  <Target size={15} className="text-[#5c7cfa]" />
                  <strong className="mt-1.5 block text-sm text-[#11182b]">
                    {totalQuestions}
                  </strong>
                  <span className="text-[10px] font-semibold text-[#7a8496]">
                    soal
                  </span>
                </div>
                <div className="rounded-xl border border-white/80 bg-white/90 px-3 py-3 shadow-sm">
                  <Clock3 size={15} className="text-[#00a98f]" />
                  <strong className="mt-1.5 block text-sm text-[#11182b]">
                    {minutes(totalSeconds)}
                  </strong>
                  <span className="text-[10px] font-semibold text-[#7a8496]">
                    total
                  </span>
                </div>
                <div className="rounded-xl border border-white/80 bg-white/90 px-3 py-3 shadow-sm">
                  <Gauge size={15} className="text-[#7c9b19]" />
                  <strong className="mt-1.5 block text-sm text-[#11182b]">
                    {suite.sections.length}
                  </strong>
                  <span className="text-[10px] font-semibold text-[#7a8496]">
                    section
                  </span>
                </div>
              </div>
            </div>

            <div className="px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 lg:px-7">
              <div className="grid gap-3 md:grid-cols-3 md:gap-4">
                {suite.sections.map((item, index) => (
                  <section
                    key={item.id}
                    className="group flex min-w-0 flex-col rounded-2xl border border-[#dfe4ec] bg-[#fbfcfe] p-4 transition md:min-h-[228px] md:p-5 md:hover:-translate-y-0.5 md:hover:border-[#c7d1e4] md:hover:shadow-[0_10px_25px_rgba(11,16,32,0.05)]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#e9fbf7] text-xs font-black text-[#0b7f6d]">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-[#405fd6]">
                            {item.section.code}
                          </span>
                          <span className="block truncate text-[11px] font-semibold text-[#7a8496]">
                            {item.section.name}
                          </span>
                        </div>
                      </div>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-[#596477] ring-1 ring-[#e2e7ef]">
                        {minutes(item.durationSeconds)}
                      </span>
                    </div>

                    <h3 className="mt-4 text-[16px] font-extrabold leading-snug text-[#11182b] md:text-[17px]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-[12px] leading-5 text-[#697386] md:text-[13px] md:leading-6">
                      {item.description}
                    </p>

                    <div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-[#596477] md:mt-auto md:pt-5">
                      <span>{item.questionCount} soal</span>
                      <span className="text-[#b8c0cc]">•</span>
                      <span>Timer khusus</span>
                    </div>

                    <button
                      type="button"
                      disabled={busy || item.access !== "FREE"}
                      onClick={() => void start("tryout", item.slug)}
                      className="mt-4 flex min-h-11 w-full items-center justify-between gap-3 rounded-xl bg-[#0b1020] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#18233e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5c7cfa] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Mulai {item.section.code}
                      <ArrowRight size={16} />
                    </button>
                  </section>
                ))}
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#f7f8fa] px-3.5 py-3 text-[11px] leading-5 text-[#697386] sm:px-4">
                <Clock3 size={14} className="mt-0.5 shrink-0 text-[#5c7cfa]" />
                <p>
                  Timer dimulai saat section dibuka. Kamu tetap bisa meninjau
                  jawaban sebelum mengumpulkan selama waktu masih tersedia.
                </p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
