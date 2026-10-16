"use client";

import { Activity, ArrowRight } from "lucide-react";
import { TryoutCatalog } from "../tryout-catalog";
import { PageHeading } from "./view-ui";

export function TryoutView({ busy, start }: { busy: boolean; start: (kind: string, topic?: string) => Promise<void>; [key: string]: unknown }) {
  return (
    <>
      <PageHeading
        eyebrow="VECTRA ASSESSMENT"
        title="Measure your position under real time pressure."
        subtitle="Mini Assessment menggunakan section PK, PM, dan PU yang sudah tersedia. Setiap section memiliki timer sendiri dan pembahasan dibuka setelah selesai."
      />

      <TryoutCatalog busy={busy} start={start} />

      <section className="mt-7 flex flex-col gap-4 rounded-2xl border border-[#dfe4ec] bg-white p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e9fbf7] text-[#0b7f6d]"><Activity size={20} /></span>
          <div>
            <h2 className="font-extrabold text-[#11182b]">Belum tahu current position-mu?</h2>
            <p className="mt-1 text-sm leading-6 text-[#697386]">Mulai dari VECTRA Diagnostic untuk membentuk learning profile sebelum memilih practice atau assessment berikutnya.</p>
          </div>
        </div>
        <button type="button" className="flex shrink-0 items-center justify-between gap-3 rounded-xl border border-[#5c7cfa] bg-white px-4 py-3 text-sm font-extrabold text-[#405fd6] transition hover:bg-[#eef2ff] disabled:cursor-not-allowed disabled:opacity-50" disabled={busy} onClick={() => void start("diagnostic")}>Start Diagnostic ↗ <ArrowRight size={16} /></button>
      </section>
    </>
  );
}
