"use client";

import { Activity, ArrowRight } from "lucide-react";
import { TryoutCatalog } from "../tryout-catalog";
import { PageHeading } from "./view-ui";

export function TryoutView({
  busy,
  start,
}: {
  busy: boolean;
  start: (kind: string, topic?: string) => Promise<void>;
  [key: string]: unknown;
}) {
  return (
    <>
      <PageHeading
        eyebrow="SIMULASI UTBK"
        title="Uji kemampuanmu dengan ritme waktu yang sebenarnya."
        subtitle="Mini Tryout LevelUP memakai struktur resmi untuk section PK, PM, dan PU yang sudah tersedia. Kerjakan per section dengan timer masing-masing, lalu baca pembahasan setelah selesai."
      />

      <TryoutCatalog busy={busy} start={start} />

      <section className="mt-7 flex flex-col gap-4 rounded-2xl border border-[#eadfe0] bg-[#fffaf8] p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff0ee] text-[#9e2027]"><Activity size={20} /></span>
          <div>
            <h2 className="font-extrabold text-[#35292b]">Belum tahu titik lemahmu?</h2>
            <p className="mt-1 text-sm leading-6 text-[#806d6f]">Mulai dari diagnostik untuk mendapatkan gambaran awal, lalu kembali ke Learning dan Latihan sebelum mencoba tryout.</p>
          </div>
        </div>
        <button
          type="button"
          className="flex shrink-0 items-center justify-between gap-3 rounded-xl border border-[#d8b9bc] bg-white px-4 py-3 text-sm font-extrabold text-[#8f1d24] transition hover:bg-[#fff3f1] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={busy}
          onClick={() => void start("diagnostic")}
        >
          Mulai diagnostik <ArrowRight size={16} />
        </button>
      </section>
    </>
  );
}
