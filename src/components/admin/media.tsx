"use client";

import { useEffect, useState } from "react";
import { adminGet, adminPost } from "./api";
import type { Media } from "@/features/content/model";

export function MediaReferences() {
  const [media, setMedia] = useState<Media[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"upload" | "register">("upload");

  const load = () =>
    adminGet<Media[]>("media_list")
      .then(setMedia)
      .catch((e) => setError(e.message));
  useEffect(() => {
    void load();
  }, []);

  const upload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/media", {
        method: "POST",
        body: new FormData(e.currentTarget),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      e.currentTarget.reset();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload media gagal.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ops-content-page media-page">
      <header className="ops-page-head">
        <div>
          <span className="ops-eyebrow">ASSET LIBRARY</span>
          <h1>Media</h1>
          <p>
            Upload gambar, diagram, atau dokumen sekali lalu lampirkan ke soal
            dan pembahasan dari Question Editor.
          </p>
        </div>
      </header>

      <div
        className="media-mode-tabs"
        role="tablist"
        aria-label="Media input mode"
      >
        <button
          type="button"
          className={mode === "upload" ? "active" : ""}
          onClick={() => setMode("upload")}
        >
          Upload file
        </button>
        <button
          type="button"
          className={mode === "register" ? "active" : ""}
          onClick={() => setMode("register")}
        >
          Register path manual
        </button>
      </div>

      <div className="media-layout">
        <section className="data-panel media-register-panel">
          {mode === "upload" ? (
            <>
              <div className="data-panel-head">
                <div>
                  <h2>Upload ke storage</h2>
                  <p>Tidak perlu lagi menulis bucket/path secara manual.</p>
                </div>
              </div>
              <form className="media-form" onSubmit={upload}>
                <label className="file-drop media-drop">
                  <strong>Pilih gambar / diagram / PDF</strong>
                  <span>
                    PNG, JPG, WebP, AVIF, SVG, atau PDF · maksimal 5 MB.
                  </span>
                  <input
                    type="file"
                    name="file"
                    accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml,application/pdf"
                    required
                  />
                </label>
                <label className="ops-field">
                  Alt text <small>disarankan untuk gambar</small>
                  <input
                    name="alt_text"
                    placeholder="Contoh: Diagram segitiga ABC dengan tinggi 8 cm"
                  />
                </label>
                <label className="ops-field">
                  URL sumber <small>opsional, hanya provenance</small>
                  <input name="source_url" placeholder="https://..." />
                </label>
                <button className="ops-primary" disabled={busy}>
                  {busy ? "Mengunggah…" : "Upload & Register"}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="data-panel-head">
                <div>
                  <h2>Register asset existing</h2>
                  <p>
                    Mode advanced untuk object yang sudah ada di Supabase
                    Storage.
                  </p>
                </div>
              </div>
              <form
                className="media-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await adminPost(
                      "media_create",
                      Object.fromEntries(new FormData(e.currentTarget)),
                    );
                    setError("");
                    e.currentTarget.reset();
                    await load();
                  } catch (e) {
                    setError(
                      e instanceof Error
                        ? e.message
                        : "Gagal mendaftarkan media.",
                    );
                  }
                }}
              >
                <div className="authoring-grid two">
                  <label className="ops-field">
                    Jenis
                    <select name="kind">
                      {["IMAGE", "DIAGRAM", "DOCUMENT"].map((k) => (
                        <option key={k}>{k}</option>
                      ))}
                    </select>
                  </label>
                  <label className="ops-field">
                    Nama file
                    <input name="original_filename" required />
                  </label>
                  <label className="ops-field wide">
                    Storage path
                    <input
                      name="storage_path"
                      required
                      placeholder="levelup-content/question-media/..."
                    />
                  </label>
                  <label className="ops-field">
                    MIME type
                    <input name="mime_type" required />
                  </label>
                  <label className="ops-field">
                    File size (bytes)
                    <input name="file_size" required inputMode="numeric" />
                  </label>
                  <label className="ops-field">
                    Width <small>opsional</small>
                    <input name="width" inputMode="numeric" />
                  </label>
                  <label className="ops-field">
                    Height <small>opsional</small>
                    <input name="height" inputMode="numeric" />
                  </label>
                  <label className="ops-field wide">
                    Alt text
                    <input name="alt_text" />
                  </label>
                  <label className="ops-field wide">
                    Source reference URL
                    <input name="source_url" />
                  </label>
                </div>
                <button className="ops-primary">Register asset</button>
              </form>
            </>
          )}
          {error && (
            <div className="ops-message error" role="alert">
              {error}
            </div>
          )}
        </section>

        <aside className="media-guide">
          <span className="ops-eyebrow">MEDIA PIPELINE</span>
          <h2>Source file → Storage → Asset → Question.</h2>
          <ol>
            <li>Upload file melalui panel ini.</li>
            <li>File disimpan di bucket media LevelUP.</li>
            <li>Metadata otomatis diregistrasikan ke database.</li>
            <li>Lampirkan asset dari Question Editor.</li>
          </ol>
          <p>
            Untuk C4.6, upload langsung sudah tersedia. Auto-resize/convert
            WebP/AVIF akan ditambahkan setelah pipeline dasar tervalidasi agar
            kita tidak merusak diagram matematika.
          </p>
        </aside>
      </div>

      <section className="data-panel">
        <div className="data-panel-head">
          <div>
            <h2>Asset library</h2>
            <p>{media.length} item</p>
          </div>
        </div>
        {media.length ? (
          <div className="media-grid">
            {media.map((m) => (
              <article className="media-item" key={m.id}>
                <div className="media-thumb">
                  {m.kind === "IMAGE"
                    ? "IMG"
                    : m.kind === "DIAGRAM"
                      ? "DGM"
                      : "DOC"}
                </div>
                <div>
                  <strong>{m.original_filename}</strong>
                  <span>
                    {m.kind} · {m.mime_type}
                  </span>
                  <small>{m.storage_path}</small>
                  {m.alt_text && <p>{m.alt_text}</p>}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state compact">
            <strong>Belum ada media.</strong>
            <p>Upload asset pertama untuk dipakai pada soal atau pembahasan.</p>
          </div>
        )}
      </section>
    </div>
  );
}
