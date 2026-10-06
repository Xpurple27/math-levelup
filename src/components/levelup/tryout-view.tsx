"use client";
import { ArrowRight } from "lucide-react";
import { TryoutCatalog } from "@/components/tryout-catalog";
import { PageHeading } from "./view-ui";
import type { View, Attempt, History } from "./types";
import type { Dispatch, SetStateAction } from "react";
type Props = {
  history: History[];
  busy: boolean;
  start: (kind: string, t?: string) => Promise<void>;
  syncAttempt: (a: Attempt) => void;
  setView: Dispatch<SetStateAction<View>>;
  setError: Dispatch<SetStateAction<string>>;
};
export function TryoutView({
  history,
  busy,
  start,
  syncAttempt,
  setView,
  setError,
}: Props) {
  return (
    <>
      <PageHeading
        eyebrow="TRYOUT UTBK"
        title="Pilih paket, ukur kemampuanmu"
        subtitle="Paket PK, PM, dan PU dengan susunan soal tetap. Selesaikan tes, temukan kelemahan, lalu belajar terarah."
      />
      <TryoutCatalog
        history={history}
        busy={busy}
        onStart={(slug) => void start("tryout", slug)}
        onResult={async (id) => {
          const r = await fetch(`/api/action?attempt=${id}`);
          const d = await r.json();
          if (d.attempt) {
            syncAttempt(d.attempt);
            setView("result");
          } else setError(d.error || "Hasil belum tersedia.");
        }}
      />
      <section className="panel">
        <span className="eyebrow purple-text">
          DIAGNOSTIK AWAL · TERPISAH DARI PAKET
        </span>
        <h2>Belum tahu titik awalmu?</h2>
        <p>
          Diagnostik singkat: 15 soal campuran PK/PM/PU, 30 menit, untuk membuat
          profil kemampuan awal.
        </p>
        <button
          className="button secondary"
          disabled={busy}
          onClick={() => start("diagnostic")}
        >
          Mulai / lanjutkan diagnostik
          <ArrowRight size={17} />
        </button>
      </section>
    </>
  );
}
