"use client";
import { useEffect, useState } from "react";
import { adminGet, adminPost } from "./api";
import type { Media } from "@/features/content/model";
const isImage = (m: Media) =>
  m.kind === "IMAGE" ||
  m.kind === "DIAGRAM" ||
  m.mime_type?.startsWith("image/");
export function MediaManager() {
  const [assets, setAssets] = useState<Media[]>([]),
    [selected, setSelected] = useState<Media | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [zoom, setZoom] = useState(1),
    [rotation, setRotation] = useState(0),
    [panX, setPanX] = useState(0),
    [panY, setPanY] = useState(0),
    [aspect, setAspect] = useState("original");
  const load = () =>
    adminGet<Media[]>("media_list")
      .then(setAssets)
      .catch((e) => setError(e.message));
  useEffect(() => {
    void load();
  }, []);
  const upload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const form = new FormData(e.currentTarget),
        r = await fetch("/api/admin/media", { method: "POST", body: form }),
        d = await r.json();
      if (!r.ok) throw Error(d.error || "Upload media gagal.");
      e.currentTarget.reset();
      await load();
    } catch (x) {
      setError(x instanceof Error ? x.message : "Upload media gagal.");
    } finally {
      setBusy(false);
    }
  };
  const register = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    try {
      const form = new FormData(e.currentTarget);
      await adminPost("media_create", Object.fromEntries(form.entries()));
      e.currentTarget.reset();
      await load();
    } catch (x) {
      setError(x instanceof Error ? x.message : "Registrasi media gagal.");
    } finally {
      setBusy(false);
    }
  };
  const open = (m: Media) => {
    setSelected(m);
    setZoom(1);
    setRotation(0);
    setPanX(0);
    setPanY(0);
    setAspect("original");
  };
  const saveEdited = async () => {
    if (!selected?.url || !isImage(selected)) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch(selected.url);
      if (!r.ok) throw Error("Gambar tidak dapat dibaca.");
      const bitmap = await createImageBitmap(await r.blob()),
        ratios: Record<string, number> = {
          "1:1": 1,
          "4:3": 4 / 3,
          "16:9": 16 / 9,
        },
        ratio = ratios[aspect] || bitmap.width / bitmap.height,
        max = 1600;
      let width = Math.min(bitmap.width, max),
        height = Math.round(width / ratio);
      if (height > max) {
        height = max;
        width = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(320, width);
      canvas.height = Math.max(240, height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw Error("Editor gambar tidak tersedia.");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2 + panX * 2, canvas.height / 2 + panY * 2);
      ctx.rotate((rotation * Math.PI) / 180);
      const fit =
        Math.max(canvas.width / bitmap.width, canvas.height / bitmap.height) *
        zoom;
      ctx.drawImage(
        bitmap,
        (-bitmap.width * fit) / 2,
        (-bitmap.height * fit) / 2,
        bitmap.width * fit,
        bitmap.height * fit,
      );
      ctx.restore();
      bitmap.close();
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (v) => (v ? resolve(v) : reject(Error("Gagal membuat hasil edit."))),
          "image/webp",
          0.92,
        ),
      );
      const base =
          selected.original_filename.replace(/\.[^.]+$/, "") || "media",
        file = new File([blob], `${base}-edited-${Date.now()}.webp`, {
          type: "image/webp",
        }),
        form = new FormData();
      form.set("file", file);
      form.set("kind", selected.kind === "DIAGRAM" ? "DIAGRAM" : "IMAGE");
      form.set("alt_text", selected.alt_text || selected.original_filename);
      const response = await fetch("/api/admin/media", {
          method: "POST",
          body: form,
        }),
        data = await response.json();
      if (!response.ok)
        throw Error(data.error || "Gagal menyimpan hasil edit.");
      await load();
      setSelected(null);
    } catch (x) {
      setError(x instanceof Error ? x.message : "Gagal menyimpan hasil edit.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="ops-content-page media-page">
      <header className="ops-page-head">
        <div>
          <span className="ops-eyebrow">MEDIA LIBRARY</span>
          <h1>Media</h1>
          <p>
            Upload, periksa, crop, zoom, dan rotate gambar. Hasil edit disimpan
            sebagai salinan baru agar original tetap aman.
          </p>
        </div>
      </header>
      {error && (
        <p role="alert" className="ops-message error">
          {error}
        </p>
      )}
      <section className="media-workspace-grid">
        <form className="authoring-card media-upload-form" onSubmit={upload}>
          <div className="authoring-section-head">
            <span>01</span>
            <div>
              <h2>Upload media</h2>
              <p>PNG, JPG, WebP, AVIF, SVG, atau PDF hingga 5 MB.</p>
            </div>
          </div>
          <label className="ops-field">
            File
            <input
              required
              name="file"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml,application/pdf"
            />
          </label>
          <div className="authoring-grid two">
            <label className="ops-field">
              Jenis
              <select name="kind" defaultValue="IMAGE">
                <option>IMAGE</option>
                <option>DIAGRAM</option>
                <option>DOCUMENT</option>
              </select>
            </label>
            <label className="ops-field">
              Alt text
              <input name="alt_text" placeholder="Deskripsi visual" />
            </label>
          </div>
          <button className="ops-primary" disabled={busy}>
            Upload media
          </button>
        </form>
        <details className="authoring-card advanced-media-register">
          <summary>Advanced: register object yang sudah ada</summary>
          <form onSubmit={register}>
            <label className="ops-field">
              Nama file
              <input required name="original_filename" />
            </label>
            <label className="ops-field">
              Storage path
              <input required name="storage_path" />
            </label>
            <input type="hidden" name="kind" value="IMAGE" readOnly />
            <input type="hidden" name="mime_type" value="image/webp" readOnly />
            <input type="hidden" name="file_size" value="0" readOnly />
            <button className="ops-secondary" disabled={busy}>
              Register
            </button>
          </form>
        </details>
      </section>
      <section className="data-panel media-library-panel">
        <div className="data-panel-head">
          <div>
            <h2>Asset library</h2>
            <p>Klik asset untuk melihat preview dan editor.</p>
          </div>
          <span className="status-chip">{assets.length} asset</span>
        </div>
        {!assets.length ? (
          <div className="empty-state compact">
            <strong>Belum ada media.</strong>
          </div>
        ) : (
          <div className="media-asset-grid">
            {assets.map((m) => (
              <button
                type="button"
                className="media-asset-card"
                key={m.id}
                onClick={() => open(m)}
              >
                <div className="media-thumb">
                  {isImage(m) && m.url ? (
                    <img src={m.url} alt={m.alt_text || m.original_filename} />
                  ) : (
                    <span>{m.kind}</span>
                  )}
                </div>
                <strong>{m.original_filename}</strong>
                <small>{m.mime_type}</small>
              </button>
            ))}
          </div>
        )}
      </section>
      {selected && (
        <div className="media-modal-backdrop" role="dialog" aria-modal="true">
          <div className="media-editor-modal">
            <div className="media-editor-head">
              <div>
                <span className="ops-eyebrow">MEDIA PREVIEW</span>
                <h2>{selected.original_filename}</h2>
              </div>
              <button onClick={() => setSelected(null)}>Tutup</button>
            </div>
            {isImage(selected) && selected.url ? (
              <>
                <div
                  className={`media-crop-stage aspect-${aspect.replace(":", "-")}`}
                >
                  <img
                    src={selected.url}
                    alt={selected.alt_text || selected.original_filename}
                    style={{
                      transform: `translate(${panX}px, ${panY}px) scale(${zoom}) rotate(${rotation}deg)`,
                    }}
                  />
                </div>
                <div className="media-edit-controls">
                  <label>
                    Crop ratio
                    <select
                      value={aspect}
                      onChange={(e) => setAspect(e.target.value)}
                    >
                      <option value="original">Original</option>
                      <option value="1:1">1:1</option>
                      <option value="4:3">4:3</option>
                      <option value="16:9">16:9</option>
                    </select>
                  </label>
                  <label>
                    Zoom
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step=".05"
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                    />
                  </label>
                  <label>
                    Geser X
                    <input
                      type="range"
                      min="-120"
                      max="120"
                      value={panX}
                      onChange={(e) => setPanX(Number(e.target.value))}
                    />
                  </label>
                  <label>
                    Geser Y
                    <input
                      type="range"
                      min="-120"
                      max="120"
                      value={panY}
                      onChange={(e) => setPanY(Number(e.target.value))}
                    />
                  </label>
                  <label>
                    Rotasi
                    <select
                      value={rotation}
                      onChange={(e) => setRotation(Number(e.target.value))}
                    >
                      <option value="0">0°</option>
                      <option value="90">90°</option>
                      <option value="180">180°</option>
                      <option value="270">270°</option>
                    </select>
                  </label>
                </div>
                <div className="media-editor-actions">
                  <span>Original tidak ditimpa.</span>
                  <button
                    className="ops-primary"
                    disabled={busy}
                    onClick={() => void saveEdited()}
                  >
                    Simpan salinan hasil edit
                  </button>
                </div>
              </>
            ) : selected.url ? (
              <iframe
                className="media-document-preview"
                src={selected.url}
                title={selected.original_filename}
              />
            ) : (
              <p>Preview tidak tersedia.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
