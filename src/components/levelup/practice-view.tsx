"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock3, Layers3, LockKeyhole, Target } from "lucide-react";
import type { Mastery } from "@/lib/scoring";
import type { Dispatch, SetStateAction } from "react";

type Props = {
  section: string;
  setSection: Dispatch<SetStateAction<string>>;
  topic: string;
  setTopic: Dispatch<SetStateAction<string>>;
  difficulty: string;
  setDifficulty: Dispatch<SetStateAction<string>>;
  count: number;
  setCount: Dispatch<SetStateAction<number>>;
  busy: boolean;
  start: (kind: string, t?: string) => Promise<void>;
  recommended: string;
  weakest: Mastery | undefined;
};

type PracticePackage = {
  id: string;
  code: string;
  slug: string;
  title: string;
  description: string;
  access: "FREE" | "PREMIUM";
  estimatedMinutes: number;
  section: { id: string; code: string; name: string };
  domain: { id: string; name: string; description: string };
  subtopicIds: string[];
  questionCount: number;
  difficulty: { basic: number; medium: number; hard: number };
};

const sections = [
  { code: "PK", label: "Pengetahuan Kuantitatif" },
  { code: "PM", label: "Penalaran Matematika" },
  { code: "PU", label: "Penalaran Umum" },
];

function mixLabel(item: PracticePackage) {
  const { basic, medium, hard } = item.difficulty;
  if (hard > medium && hard > basic) return "Menantang";
  if (basic > medium && basic > hard) return "Fondasi";
  return "Campuran";
}

export function PracticeView({ busy, start, recommended }: Props) {
  const [packages, setPackages] = useState<PracticePackage[]>([]);
  const [activeSection, setActiveSection] = useState("PK");
  const [activeDomain, setActiveDomain] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/practice-packages", { cache: "no-store" })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok)
          throw new Error(json.error || "Practice gagal dimuat.");
        if (!alive) return;
        const items = (json.data || []) as PracticePackage[];
        setPackages(items);

        const preferred = items.find(
          (pkg) =>
            pkg.access === "FREE" && pkg.subtopicIds.includes(recommended),
        );
        const firstSection =
          preferred?.section.code ||
          sections.find((item) =>
            items.some((pkg) => pkg.section.code === item.code),
          )?.code ||
          "PK";
        const firstPackage =
          preferred || items.find((pkg) => pkg.section.code === firstSection);
        setActiveSection(firstSection);
        setActiveDomain(firstPackage?.domain.id || "");
      })
      .catch((reason: Error) => alive && setError(reason.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [recommended]);

  const sectionPackages = useMemo(
    () => packages.filter((item) => item.section.code === activeSection),
    [packages, activeSection],
  );
  const domains = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        description: string;
        packages: number;
        questions: number;
      }
    >();
    for (const item of sectionPackages) {
      const current = map.get(item.domain.id);
      if (current) {
        current.packages += 1;
        current.questions += item.questionCount;
      } else {
        map.set(item.domain.id, {
          id: item.domain.id,
          name: item.domain.name,
          description: item.domain.description,
          packages: 1,
          questions: item.questionCount,
        });
      }
    }
    return [...map.values()];
  }, [sectionPackages]);

  const visiblePackages = sectionPackages.filter(
    (item) => !activeDomain || item.domain.id === activeDomain,
  );
  const selectedDomain = domains.find((item) => item.id === activeDomain);

  function chooseSection(code: string) {
    setActiveSection(code);
    const first = packages.find((item) => item.section.code === code);
    setActiveDomain(first?.domain.id || "");
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[#dfe4ec] bg-white shadow-sm">
      <div className="border-b border-[#dfe4ec] px-4 pt-4 md:px-6 md:pt-5">
        <div className="mb-4">
          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#00a88f]">
            VECTRA PRACTICE
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.03em] text-[#11182b]">
            Practice what matters.
          </h1>
          <p className="mt-1 text-sm text-[#697386]">
            Pilih subtes dan domain. Setiap practice set berisi 10 soal campuran
            dengan pembahasan terstruktur.
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4">
          {sections.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => chooseSection(item.code)}
              className={`min-w-max rounded-xl border px-4 py-3 text-sm font-extrabold transition ${
                activeSection === item.code
                  ? "practice-section-tab-active border-[#0b1020] bg-[#0b1020] text-white shadow-sm"
                  : "border-[#dfe4ec] bg-white text-[#596477] hover:border-[#5c7cfa] hover:bg-[#f7f8fa] hover:text-[#0b1020]"
              }`}
            >
              <span className="mr-1.5">{item.code}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid min-h-[430px] gap-4 p-5 md:grid-cols-[220px_1fr]">
          <div className="h-72 animate-pulse rounded-xl bg-[#eef1f5]" />
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-56 animate-pulse rounded-xl bg-[#eef1f5]"
              />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="p-8 text-sm text-[#d94c5c]">{error}</div>
      ) : domains.length ? (
        <div className="grid min-h-[430px] md:grid-cols-[230px_1fr]">
          <aside className="border-b border-[#dfe4ec] bg-[#f7f8fa] p-3 md:border-b-0 md:border-r md:p-4">
            <div className="mb-2 px-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#7a8496]">
              Domain
            </div>
            <div className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
              {domains.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveDomain(item.id)}
                  className={`min-w-max rounded-xl px-3 py-3 text-left transition md:min-w-0 ${
                    activeDomain === item.id
                      ? "bg-[#e9fbf7] text-[#0b5f54] shadow-sm"
                      : "text-[#596477] hover:bg-white"
                  }`}
                >
                  <strong className="block text-sm">{item.name}</strong>
                  <span className="mt-1 hidden text-[11px] text-[#7a8496] md:block">
                    {item.packages} set · {item.questions} soal
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <div className="p-4 md:p-6">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.14em] text-[#5c7cfa]">
                  {activeSection} · LEARNING DOMAIN
                </div>
                <h2 className="mt-1 text-xl font-extrabold text-[#11182b]">
                  {selectedDomain?.name}
                </h2>
                {selectedDomain?.description && (
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-[#697386]">
                    {selectedDomain.description}
                  </p>
                )}
              </div>
              <span className="rounded-full bg-[#f3ffde] px-3 py-1.5 text-xs font-extrabold text-[#54730f]">
                {visiblePackages.length} set tersedia
              </span>
            </div>

            {visiblePackages.length ? (
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {visiblePackages.map((item) => (
                  <article
                    key={item.id}
                    className="group flex min-h-[245px] flex-col rounded-2xl border border-[#dfe4ec] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#5c7cfa] hover:shadow-md"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-[#eef2ff] px-2.5 py-1 text-[11px] font-black text-[#405fd6]">
                        {mixLabel(item)}
                      </span>
                      {item.access === "PREMIUM" ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-[#405fd6]">
                          <LockKeyhole size={12} /> Premium
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-[#17745f]">
                          Gratis
                        </span>
                      )}
                    </div>

                    <div className="mt-4">
                      <h3 className="text-lg font-extrabold leading-snug text-[#11182b]">
                        {item.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#697386]">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-2 text-xs text-[#596477]">
                      <span className="flex items-center gap-1.5">
                        <Target size={14} /> {item.questionCount} soal
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock3 size={14} /> ± {item.estimatedMinutes} menit
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-bold">
                      <span className="rounded-md bg-[#e9fbf7] px-2 py-1 text-[#17745f]">
                        Basic {item.difficulty.basic}
                      </span>
                      <span className="rounded-md bg-[#eef2ff] px-2 py-1 text-[#405fd6]">
                        Medium {item.difficulty.medium}
                      </span>
                      <span className="rounded-md bg-[#f3ffde] px-2 py-1 text-[#54730f]">
                        Hard {item.difficulty.hard}
                      </span>
                    </div>

                    <button
                      className="mt-auto flex w-full items-center justify-between rounded-xl bg-[#0b1020] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#18233e] disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={
                        busy ||
                        item.access !== "FREE" ||
                        item.questionCount === 0
                      }
                      onClick={() => void start("practice", item.slug)}
                    >
                      {item.access === "FREE"
                        ? "Start Practice ↗"
                        : "Premium practice"}
                      <ArrowRight size={17} />
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="flex min-h-60 items-center justify-center rounded-xl border border-dashed border-[#dfe4ec] text-sm text-[#697386]">
                <Layers3 size={18} className="mr-2" /> Practice belum tersedia.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex min-h-80 items-center justify-center text-sm text-[#697386]">
          <Layers3 size={20} className="mr-2" /> Practice {activeSection} belum
          tersedia.
        </div>
      )}
    </section>
  );
}
