"use client";

import { useEffect, useState } from "react";
import { adminGet, adminPost } from "./api";
import type { Media } from "@/features/content/model";

export function MediaReferences() {
  const [media, setMedia] = useState<Media[]>([]);
  const [error, setError] = useState("");

  const load = () => adminGet<Media[]>("media_list").then(setMedia).catch((e) => setError(e.message));
  useEffect(() => { void load(); }, []);

  return (
    <div className="ops-content-page media-page">
      <header className="ops-page-head">
        <div>
          <span className="ops-eyebrow">ASSET LIBRARY</span>
          <h1>Media</h1>
          <p>Simpan referensi gambar, diagram, dan dokumen yang dipakai oleh soal dan pembahasan.</p>
        </div>
      </header>

      <div className="media-layout">
        <section className="data-panel media-register-panel">
          <div className="data-panel-head"><div><h2>Daftarkan asset</h2><p>Untuk sekarang asset diunggah ke object storage terlebih dahulu, lalu diregistrasikan di sini.</p></div></div>
          <form
            className="media-form"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await adminPost("media_create", Object.fromEntries(new FormData(e.currentTarget)));
                setError("");
                e.currentTarget.reset();
                await load();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Gagal mendaftarkan media.");
              }
            }}
          >
            <div className="authoring-grid two">
              <label className="ops-field">Jenis<select name="kind">{["IMAGE", "DIAGRAM", "DOCUMENT"].map((k) => <option key={k}>{k}</option>)}</select></label>
              <label className="ops-field">Nama file<input name="original_filename" required placeholder="diagram-peluang.webp" /></label>
              <label className="ops-field wide">Storage path<input name="storage_path" required placeholder="question-media/2026/diagram-peluang.webp" /></label>
              <label className="ops-field">MIME type<input name="mime_type" required placeholder="image/webp" /></label>
              <label className="ops-field">File size (bytes)<input name="file_size" required inputMode="numeric" /></label>
              <label className="ops-field">Width <small>opsional</small><input name="width" inputMode="numeric" /></label>
              <label className="ops-field">Height <small>opsional</small><input name="height" inputMode="numeric" /></label>
              <label className="ops-field wide">Alt text<input name="alt_text" placeholder="Deskripsi gambar untuk aksesibilitas" /></label>
              <label className="ops-field wide">Source reference URL <small>opsional</small><input name="source_url" placeholder="URL sumber asli / provenance" /></label>
            </div>
            <button className="ops-primary">Register asset</button>
          </form>
          {error && <div className="ops-message error" role="alert">{error}</div>}
        </section>

        <aside className="media-guide">
          <span className="ops-eyebrow">MEDIA PIPELINE</span>
          <h2>Yang disimpan di database hanya metadata.</h2>
          <ol>
            <li>Upload original ke storage.</li>
            <li>Optimalkan gambar ke WebP/AVIF bila perlu.</li>
            <li>Register path dan metadata di sini.</li>
            <li>Lampirkan asset dari Question Editor.</li>
          </ol>
          <p>Google Drive tetap cocok sebagai sumber kerja/original, bukan runtime image host.</p>
        </aside>
      </div>

      <section className="data-panel">
        <div className="data-panel-head"><div><h2>Asset terdaftar</h2><p>{media.length} item</p></div></div>
        {media.length ? (
          <div className="media-grid">
            {media.map((m) => (
              <article className="media-item" key={m.id}>
                <div className="media-thumb">{m.kind === "IMAGE" ? "IMG" : m.kind === "DIAGRAM" ? "DGM" : "DOC"}</div>
                <div><strong>{m.original_filename}</strong><span>{m.kind} · {m.mime_type}</span><small>{m.storage_path}</small>{m.alt_text && <p>{m.alt_text}</p>}</div>
              </article>
            ))}
          </div>
        ) : <div className="empty-state compact"><strong>Belum ada media.</strong><p>Daftarkan asset pertama untuk dipakai pada soal atau pembahasan.</p></div>}
      </section>
    </div>
  );
}
