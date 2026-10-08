"use client";
import { TryoutCatalog } from "../tryout-catalog";
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
      <h1>Tryout</h1>
      <TryoutCatalog />
      <section className="panel">
        <h2>Kenali kemampuan awal</h2>
        <p>Diagnostik tersedia jika bank published sudah mencukupi.</p>
        <button
          className="button primary"
          disabled={busy}
          onClick={() => start("diagnostic")}
        >
          Mulai diagnostik gratis
        </button>
      </section>
    </>
  );
}
