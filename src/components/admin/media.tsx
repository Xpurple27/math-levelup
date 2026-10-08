"use client";
import { useEffect, useState } from "react";
import { adminGet, adminPost } from "./api";
import type { Media } from "@/features/content/model";
export function MediaReferences() {
  const [media, setMedia] = useState<Media[]>([]),
    [error, setError] = useState("");
  const load = () =>
    adminGet<Media[]>("media_list")
      .then(setMedia)
      .catch((e) => setError(e.message));
  useEffect(() => {
    void load();
  }, []);
  return (
    <>
      <h1>Media references</h1>
      <p>
        Daftarkan object yang sudah diunggah ke Supabase Storage. Source URL
        hanya provenance, bukan CDN. Upload/resize manager tidak termasuk fase
        ini.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await adminPost(
              "media_create",
              Object.fromEntries(new FormData(e.currentTarget)),
            );
            setError("");
            await load();
          } catch (e) {
            setError(
              e instanceof Error ? e.message : "Gagal mendaftarkan media.",
            );
          }
        }}
      >
        <label>
          Kind
          <select name="kind">
            {["IMAGE", "DIAGRAM", "DOCUMENT"].map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
        {[
          ["original_filename", "Filename"],
          ["storage_path", "Storage path (bucket/path)"],
          ["mime_type", "MIME type"],
          ["file_size", "File size in bytes"],
          ["width", "Width (optional)"],
          ["height", "Height (optional)"],
          ["alt_text", "Alt text"],
          ["source_url", "Source reference URL (optional)"],
        ].map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              name={key}
              required={[
                "original_filename",
                "storage_path",
                "mime_type",
                "file_size",
              ].includes(key)}
            />
          </label>
        ))}
        <button>Register existing object</button>
      </form>
      <p role="alert">{error}</p>
      {media.map((m) => (
        <section className="panel" key={m.id}>
          <h2>{m.original_filename}</h2>
          <p>
            {m.id} · {m.storage_path} · {m.file_size} bytes
          </p>
          <p>{m.alt_text}</p>
        </section>
      ))}
    </>
  );
}
