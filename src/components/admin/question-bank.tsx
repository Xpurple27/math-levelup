"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminGet } from "./api";
import { useAdminRole } from "./shell";
import type { Catalog, BankRow } from "@/features/content/model";
import { sourceTypes } from "@/features/content/model";

export function QuestionBank() {
  const role = useAdminRole();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [rows, setRows] = useState<BankRow[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    adminGet<Catalog>("catalog").then(setCatalog).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    let active = true;
    adminGet<{ rows: BankRow[] }>("list", { ...filters, offset: String(offset) })
      .then((d) => {
        if (active) {
          setRows(d.rows);
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

  return (
    <div className="ops-content-page question-bank-page">
      <header className="ops-page-head">
        <div>
          <span className="ops-eyebrow">CONTENT LIBRARY</span>
          <h1>Question Bank</h1>
          <p>Kelola draft, soal review, dan soal yang sudah dipublikasikan dari satu tempat.</p>
        </div>
        {role === "ADMIN" && (
          <Link className="ops-primary" href="/admin/questions/new">+ Buat soal</Link>
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
          {catalog && (["exams", "sections", "domains", "topics", "subtopics"] as const).map((key, i) => {
            const filterKey = ["exam_id", "section_id", "domain_id", "topic_id", "subtopic_id"][i];
            const label = ["Exam", "Section", "Domain", "Topic", "Subtopic"][i];
            return (
              <label className="ops-field" key={key}>
                <span>{label}</span>
                <select value={filters[filterKey] || ""} onChange={(e) => filter(filterKey, e.target.value)}>
                  <option value="">Semua</option>
                  {catalog[key].map((t) => <option key={t.id} value={t.id}>{t.code} — {t.name}</option>)}
                </select>
              </label>
            );
          })}
          {[
            ["difficulty", "Difficulty", ["BASIC", "MEDIUM", "HARD"]],
            ["status", "Status", ["DRAFT", "IN_REVIEW", "QA_PASSED", "PUBLISHED", "ARCHIVED"]],
            ["source_type", "Source", [...sourceTypes]],
          ].map(([key, label, values]) => (
            <label className="ops-field" key={String(key)}>
              <span>{String(label)}</span>
              <select value={filters[String(key)] || ""} onChange={(e) => filter(String(key), e.target.value)}>
                <option value="">Semua</option>
                {(values as string[]).map((v) => <option key={v}>{v}</option>)}
              </select>
            </label>
          ))}
        </div>
      </section>

      {error && <div className="ops-message error" role="alert">{error}</div>}

      <section className="data-panel">
        <div className="data-panel-head">
          <div><h2>Daftar soal</h2><p>TEST_ONLY tidak ditampilkan di sini.</p></div>
        </div>
        <div className="table-scroll">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Code</th><th>Section</th><th>Taxonomy</th><th>Difficulty</th><th>Status</th><th>Version</th><th>Source</th><th>Updated</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((q) => (
                <tr key={q.id}>
                  <td><strong>{q.code}</strong></td>
                  <td>{q.exam}/{q.section}</td>
                  <td><span className="taxonomy-cell">{q.domain}<small>{q.topic} / {q.subtopic}</small></span></td>
                  <td><span className={`status-chip difficulty-${q.difficulty.toLowerCase()}`}>{q.difficulty}</span></td>
                  <td><span className="status-chip">{q.logical_status === "ARCHIVED" ? "ARCHIVED" : q.status}</span></td>
                  <td>v{q.version_number}</td>
                  <td>{q.source_type}<small className="table-subtext">{q.source_title || "—"}</small></td>
                  <td>{new Date(q.updated_at).toLocaleDateString("id-ID")}</td>
                  <td><Link className="table-action" href={`/admin/questions/${q.id}`}>Buka</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && !error && (
          <div className="empty-state compact"><strong>Belum ada soal pada filter ini.</strong><p>Buat draft baru atau impor konten dari menu Imports.</p></div>
        )}
      </section>

      <div className="pagination-row">
        <button disabled={!offset} onClick={() => setOffset(Math.max(0, offset - 100))}>← Sebelumnya</button>
        <span>Offset {offset}</span>
        <button disabled={rows.length < 100} onClick={() => setOffset(offset + 100)}>Berikutnya →</button>
      </div>
    </div>
  );
}
