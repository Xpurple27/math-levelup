"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { adminGet } from "./api";
import { useAdminRole } from "./shell";
import type { Catalog, BankRow } from "@/features/content/model";
import { sourceTypes } from "@/features/content/model";
export function QuestionBank() {
  const role = useAdminRole(),
    [catalog, setCatalog] = useState<Catalog | null>(null),
    [rows, setRows] = useState<BankRow[]>([]),
    [filters, setFilters] = useState<Record<string, string>>({}),
    [error, setError] = useState(""),
    [offset, setOffset] = useState(0);
  useEffect(() => {
    adminGet<Catalog>("catalog")
      .then(setCatalog)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    let active = true;
    adminGet<{ rows: BankRow[] }>("list", {
      ...filters,
      offset: String(offset),
    })
      .then((d) => {
        if (active) {
          setRows(d.rows);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [filters, offset]);
  const filter = (key: string, value: string) => {
    setOffset(0);
    setFilters((f) => ({ ...f, [key]: value }));
  };
  return (
    <>
      <h1>Question Bank</h1>
      {role === "ADMIN" && (
        <Link className="button primary" href="/admin/questions/new">
          New Question
        </Link>
      )}
      <p>Hanya konten authoring. TEST_ONLY tidak ditampilkan.</p>
      <label className="field">
        Search code / stem
        <input
          value={filters.search || ""}
          onChange={(e) => filter("search", e.target.value)}
        />
      </label>
      <div className="admin-filters">
        {catalog &&
          (
            ["exams", "sections", "domains", "topics", "subtopics"] as const
          ).map((key, i) => (
            <label key={key}>
              {["Exam", "Section", "Domain", "Topic", "Subtopic"][i]}
              <select
                value={
                  filters[
                    [
                      "exam_id",
                      "section_id",
                      "domain_id",
                      "topic_id",
                      "subtopic_id",
                    ][i]
                  ] || ""
                }
                onChange={(e) =>
                  filter(
                    [
                      "exam_id",
                      "section_id",
                      "domain_id",
                      "topic_id",
                      "subtopic_id",
                    ][i],
                    e.target.value,
                  )
                }
              >
                <option value="">All</option>
                {catalog[key].map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.code} — {t.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
        {[
          ["difficulty", ["BASIC", "MEDIUM", "HARD"]],
          [
            "status",
            ["DRAFT", "IN_REVIEW", "QA_PASSED", "PUBLISHED", "ARCHIVED"],
          ],
          ["source_type", [...sourceTypes]],
        ].map(([key, values]) => (
          <label key={String(key)}>
            {String(key)}
            <select
              value={filters[String(key)] || ""}
              onChange={(e) => filter(String(key), e.target.value)}
            >
              <option value="">All</option>
              {(values as string[]).map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <p role="alert">{error}</p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {[
                "Code",
                "Section",
                "Taxonomy",
                "Difficulty",
                "Status",
                "Version",
                "Source",
                "Updated",
                "Action",
              ].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((q) => (
              <tr key={q.id}>
                <td>{q.code}</td>
                <td>
                  {q.exam}/{q.section}
                </td>
                <td>
                  {q.domain} / {q.topic} / {q.subtopic}
                </td>
                <td>{q.difficulty}</td>
                <td>
                  {q.logical_status === "ARCHIVED" ? "ARCHIVED" : q.status}
                </td>
                <td>{q.version_number}</td>
                <td>
                  {q.source_type}: {q.source_title || "—"}
                </td>
                <td>{new Date(q.updated_at).toLocaleDateString("id-ID")}</td>
                <td>
                  <Link href={`/admin/questions/${q.id}`}>Open / Preview</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && !error && (
        <p>Belum ada soal pada filter ini. Buat draft atau import Excel.</p>
      )}
      <div className="tag-row">
        <button
          disabled={!offset}
          onClick={() => setOffset(Math.max(0, offset - 100))}
        >
          Previous
        </button>
        <button
          disabled={rows.length < 100}
          onClick={() => setOffset(offset + 100)}
        >
          Next
        </button>
      </div>
    </>
  );
}
