"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, Clock3, Layers3, LockKeyhole, Target } from "lucide-react";
import type { Mastery } from "@/lib/scoring";
import { PageHeading } from "./view-ui";
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
  subtopic: {
    id: string;
    name: string;
    topic: { id: string; name: string; domain: { id: string; name: string } | null } | null;
  };
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

export function PracticeView({ busy, start }: Props) {
  const [packages, setPackages] = useState<PracticePackage[]>([]);
  const [activeSection, setActiveSection] = useState("PK");
  const [activeSubtopic, setActiveSubtopic] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/practice-packages", { cache: "no-store" })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || "Paket latihan gagal dimuat.");
        if (!alive) return;
        const items = (json.data || []) as PracticePackage[];
        setPackages(items);
        const firstSection = sections.find((item) => items.some((pkg) => pkg.section.code === item.code))?.code || "PK";
        const firstPackage = items.find((pkg) => pkg.section.code === firstSection);
        setActiveSection(firstSection);
        setActiveSubtopic(firstPackage?.subtopic.id || "");
      })
      .catch((reason: Error) => alive && setError(reason.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const sectionPackages = useMemo(
    () => packages.filter((item) => item.section.code === activeSection),
    [packages, activeSection],
  );
  const subtopics = useMemo(() => {
    const map = new Map<string, { id: string; name: string; topic: string; domain: string }>();
    for (const item of sectionPackages) {
      if (!map.has(item.subtopic.id)) {
        map.set(item.subtopic.id, {
          id: item.subtopic.id,
          name: item.subtopic.name,
          topic: item.subtopic.topic?.name || "Matematika",
          domain: item.subtopic.topic?.domain?.name || "Matematika",
        });
      }
    }
    return [...map.values()];
  }, [sectionPackages]);
  const visiblePackages = sectionPackages.filter((item) => !activeSubtopic || item.subtopic.id === activeSubtopic);

  function chooseSection(code: string) {
    setActiveSection(code);
    const first = packages.find((item) => item.section.code === code);
    setActiveSubtopic(first?.subtopic.id || "");
  }

  return (
    <>
      <PageHeading
        eyebrow="LATIHAN TERARAH"
        title="Pilih materi. Pilih paket. Mulai latihan."
        subtitle="Setiap paket sudah disusun dari Question Bank. Isi paket tetap, sehingga progresmu bisa dibandingkan dari percobaan ke percobaan."
      />

      <section className="rounded-2xl border border-[#eadfe0] bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-wrap items-center gap-2 border-b border-[#eee5e6] pb-4">
          {sections.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => chooseSection(item.code)}
              className={`rounded-xl px-4 py-2.5 text-sm font-extrabold transition ${
                activeSection === item.code
                  ? "bg-[#8f1d24] text-white shadow-sm"
                  : "bg-[#fff7f5] text-[#6f4d50] hover:bg-[#f8e8e5]"
              }`}
            >
              {item.code}
              <span className="ml-2 hidden font-medium opacity-80 md:inline">{item.label}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-3 py-5 md:grid-cols-3">
            {[0, 1, 2].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-[#f5efef]" />)}
          </div>
        ) : error ? (
          <div className="py-8 text-sm text-[#8f1d24]">{error}</div>
        ) : sectionPackages.length ? (
          <div className="pt-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#92787a]">
              <BookOpen size={15} /> Pilih materi
            </div>
            <div className="flex flex-wrap gap-2">
              {subtopics.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSubtopic(item.id)}
                  className={`rounded-xl border px-4 py-3 text-left transition ${
                    activeSubtopic === item.id
                      ? "border-[#d95d63] bg-[#fff0ee] text-[#7f1519]"
                      : "border-[#eadfe0] bg-white text-[#49383a] hover:border-[#d8b9bc]"
                  }`}
                >
                  <span className="block text-xs text-[#947d7f]">{item.domain} · {item.topic}</span>
                  <strong className="mt-1 block text-sm">{item.name}</strong>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 py-8 text-sm text-[#816b6d]">
            <Layers3 size={20} /> Paket {activeSection} belum tersedia. Konten akan muncul setelah dipublikasikan.
          </div>
        )}
      </section>

      {!loading && !error && visiblePackages.length > 0 && (
        <section className="mt-7">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.14em] text-[#a52b31]">Paket latihan</div>
              <h2 className="mt-1 text-xl font-extrabold text-[#302426]">{visiblePackages[0]?.subtopic.name}</h2>
            </div>
            <span className="text-xs font-semibold text-[#8a7375]">{visiblePackages.length} paket tersedia</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visiblePackages.map((item) => (
              <article key={item.id} className="group flex min-h-[250px] flex-col rounded-2xl border border-[#e7dcdd] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#d9b8bb] hover:shadow-md">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-[#fff0ee] px-2.5 py-1 text-[11px] font-black text-[#a52b31]">{mixLabel(item)}</span>
                  {item.access === "PREMIUM" ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-[#8f1d24]"><LockKeyhole size={12} /> Premium</span>
                  ) : (
                    <span className="text-[11px] font-bold text-[#6f826d]">Gratis</span>
                  )}
                </div>

                <div className="mt-4">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#9a8587]">{item.section.code} · {item.code}</span>
                  <h3 className="mt-2 text-lg font-extrabold leading-snug text-[#302426]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#806d6f]">{item.description}</p>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2 text-xs text-[#715e60]">
                  <span className="flex items-center gap-1.5"><Target size={14} /> {item.questionCount} soal</span>
                  <span className="flex items-center gap-1.5"><Clock3 size={14} /> ± {item.estimatedMinutes} menit</span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-bold">
                  <span className="rounded-md bg-[#eef6ed] px-2 py-1 text-[#547052]">Basic {item.difficulty.basic}</span>
                  <span className="rounded-md bg-[#fff5da] px-2 py-1 text-[#8a6922]">Medium {item.difficulty.medium}</span>
                  <span className="rounded-md bg-[#fdebed] px-2 py-1 text-[#9a3d45]">Hard {item.difficulty.hard}</span>
                </div>

                <button
                  className="mt-auto flex w-full items-center justify-between rounded-xl bg-[#8f1d24] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#76151b] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={busy || item.access !== "FREE" || item.questionCount === 0}
                  onClick={() => void start("practice", item.slug)}
                >
                  {item.access === "FREE" ? "Mulai paket" : "Paket premium"}
                  <ArrowRight size={17} />
                </button>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
