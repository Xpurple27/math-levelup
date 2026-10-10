"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminGet, adminPost } from "./api";
import { useAdminRole } from "./shell";
import type { Catalog, BankRow } from "@/features/content/model";
import { sourceTypes } from "@/features/content/model";

export function QuestionBank() {
  const role = useAdminRole();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [rows, setRows] = useState<BankRow[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminGet<Catalog>("catalog")
      .then(setCatalog)
      .catch((e) => setError(e.message));
  }, []);

  const loadRows = () =>
    adminGet<{ rows: BankRow[] }>("list", {
      ...filters,
      offset: String(offset),
    }).then((d) => {
      setRows(d.rows);
      setSelected((ids) =>
        ids.filter((id) => d.rows.some((row) => row.id === id)),
      );
      setError("");
    });

  useEffect(() => {
    let active = true;
    adminGet<{ rows: BankRow[] }>("list", {
      ...filters,
      offset: String(offset),
    })
      .then((d) => {
        if (active) {
          setRows(d.rows);
          setSelected([]);
          setError("");
        }
      })
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [filters, offset]);

  const filter = (key: string, value: string) => {
    setOffset(0);
    setFilters((f) => ({ ...f, [key]: value }));
  };

  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );

  const bulk = async (action: "send_qa" | "archive") => {
    const chosen = rows.filter((row) => selected.includes(row.id));
    if (!chosen.length) return;
    const eligible =
      action === "send_qa"
        ? chosen.filter(
            (row) =>
              row.status === "DRAFT" && row.logical_status !== "ARCHIVED",
          )
        : chosen.filter((row) => row.logical_status !== "ARCHIVED");
    if (!eligible.length) {
      setError(
        action === "send_qa"
          ? "Tidak ada draft terpilih yang bisa dikirim ke QA."
          : "Tidak ada soal aktif yang bisa diarsipkan.",
      );
      return;
    }
    if (
      !window.confirm(
        action === "send_qa"
          ? `Kirim ${eligible.length} draft ke QA? Soal yang belum lengkap akan ditolak oleh guard.`
          : `Arsipkan ${eligible.length} soal terpilih?`,
      )
    )
      return;
    setBusy(true);
    setError("");
    setNotice("");
    let success = 0;
    const failures: string[] = [];
    for (const row of eligible) {
      try {
        if (action === "send_qa")
          await adminPost("send_qa", { version_id: row.version_id });
        else await adminPost("archive", { id: row.id });
        success += 1;
      } catch (e) {
        failures.push(
          `${row.code}: ${e instanceof Error ? e.message : "gagal"}`,
        );
      }
    }
    await loadRows().catch((e) => setError(e.message));
    setSelected([]);
    setBusy(false);
    setNotice(`${success} soal berhasil diproses.`);
    if (failures.length)
      setError(
        failures.slice(0, 5).join(" · ") +
          (failures.length > 5 ? ` · +${failures.length - 5} lainnya` : ""),
      );
  };

  const allSelected =
    rows.length > 0 && rows.every((row) => selected.includes(row.id));

  return (
    <div className="ops-content-page question-bank-page">
      <header className="ops-page-head">
        <div>
          <span className="ops-eyebrow">CONTENT LIBRARY</span>
          <h1>Question Bank</h1>
          <p>
            Kelola draft, soal review, dan soal yang sudah dipublikasikan dari
            satu tempat.
          </p>
        </div>
        {role === "ADMIN" && (
          <Link className="ops-primary" href="/admin/questions/new">
            + Buat soal
          </Link>
        )}
      </header>

      <section className="filter-panel">
        <div className="filter-search-row">
          <label className="ops-field wide">
            <span>Cari soal</span>
            <input
              value={filters.search || ""}
              placeholder="Cari berdasarkan kode atau isi soal…"
              onChange={(e) => filter("search", e.target.value)}
            />
          </label>
          <div className="filter-summary">
            <strong>{rows.length}</strong>
            <span>hasil pada halaman ini</span>
          </div>
        </div>

        <div className="admin-filters polished">
          {catalog &&
            (
              ["exams", "sections", "domains", "topics", "subtopics"] as const
            ).map((key, i) => {
              const filterKey = [
                "exam_id",
                "section_id",
                "domain_id",
                "topic_id",
                "subtopic_id",
              ][i];
              const label = ["Exam", "Section", "Domain", "Topic", "Subtopic"][
                i
              ];
              return (
                <label className="ops-field" key={key}>
                  <span>{label}</span>
                  <select
                    value={filters[filterKey] || ""}
                    onChange={(e) => filter(filterKey, e.target.value)}
                  >
                    <option value="">Semua</option>
                    {catalog[key].map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.code} — {t.name}
                      </option>
                    ))}
                  </select>
                </label>
              );
            })}
          {[
            ["difficulty", "Difficulty", ["BASIC", "MEDIUM", "HARD"]],
            [
              "status",
              "Status",
              ["DRAFT", "IN_REVIEW", "QA_PASSED", "PUBLISHED", "ARCHIVED"],
            ],
            ["source_type", "Source", [...sourceTypes]],
          ].map(([key, label, values]) => (
            <label className="ops-field" key={String(key)}>
              <span>{String(label)}</span>
              <select
                value={filters[String(key)] || ""}
                onChange={(e) => filter(String(key), e.target.value)}
              >
                <option value="">Semua</option>
                {(values as string[]).map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </section>

      {error && (
        <div className="ops-message error" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="ops-message success" role="status">
          {notice}
        </div>
      )}

      {role === "ADMIN" && selected.length > 0 && (
        <div className="bulk-toolbar">
          <strong>{selected.length} soal dipilih</strong>
          <span>Bulk action sengaja dibatasi ke operasi yang aman.</span>
          <button disabled={busy} onClick={() => void bulk("send_qa")}>
            Kirim draft ke QA
          </button>
          <button disabled={busy} onClick={() => void bulk("archive")}>
            Arsipkan
          </button>
          <button disabled={busy} onClick={() => setSelected([])}>
            Batal
          </button>
        </div>
      )}

      <section className="data-panel">
        <div className="data-panel-head">
          <div>
            <h2>Daftar soal</h2>
            <p>TEST_ONLY tidak ditampilkan di sini.</p>
          </div>
        </div>
        <div className="table-scroll">
          <table className="ops-table">
            <thead>
              <tr>
                {role === "ADMIN" && (
                  <th className="select-column">
                    <input
                      aria-label="Pilih semua soal di halaman"
                      type="checkbox"
                      checked={allSelected}
                      onChange={() =>
                        setSelected(
                          allSelected ? [] : rows.map((row) => row.id),
                        )
                      }
                    />
                  </th>
                )}
                <th>Code</th>
                <th>Section</th>
                <th>Taxonomy</th>
                <th>Difficulty</th>
                <th>Status</th>
                <th>Version</th>
                <th>Source</th>
                <th>Updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((q) => (
                <tr key={q.id}>
                  {role === "ADMIN" && (
                    <td className="select-column">
                      <input
                        aria-label={`Pilih ${q.code}`}
                        type="checkbox"
                        checked={selected.includes(q.id)}
                        onChange={() => toggle(q.id)}
                      />
                    </td>
                  )}
                  <td>
                    <strong>{q.code}</strong>
                  </td>
                  <td>
                    {q.exam}/{q.section}
                  </td>
                  <td>
                    <span className="taxonomy-cell">
                      {q.domain}
                      <small>
                        {q.topic} / {q.subtopic}
                      </small>
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-chip difficulty-${q.difficulty.toLowerCase()}`}
                    >
                      {q.difficulty}
                    </span>
                  </td>
                  <td>
                    <span className="status-chip">
                      {q.logical_status === "ARCHIVED" ? "ARCHIVED" : q.status}
                    </span>
                  </td>
                  <td>v{q.version_number}</td>
                  <td>
                    {q.source_type}
                    <small className="table-subtext">
                      {q.source_title || "—"}
                    </small>
                  </td>
                  <td>{new Date(q.updated_at).toLocaleDateString("id-ID")}</td>
                  <td>
                    <Link
                      className="table-action"
                      href={`/admin/questions/${q.id}`}
                    >
                      Buka
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && !error && (
          <div className="empty-state compact">
            <strong>Belum ada soal pada filter ini.</strong>
            <p>Buat draft baru atau impor konten dari menu Imports.</p>
          </div>
        )}
      </section>

      <div className="pagination-row">
        <button
          disabled={!offset}
          onClick={() => setOffset(Math.max(0, offset - 100))}
        >
          ← Sebelumnya
        </button>
        <span>Offset {offset}</span>
        <button
          disabled={rows.length < 100}
          onClick={() => setOffset(offset + 100)}
        >
          Berikutnya →
        </button>
      </div>
    </div>
  );
}
