"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Send, UploadCloud } from "lucide-react";

type Module = {
  id: string;
  code: string;
  title: string;
  status: string;
  level: string;
  estimated_minutes: number;
};
type Lesson = { id: string; module_id: string; title: string; status: string };
type Review = {
  entity_type: string;
  entity_id: string;
  status: string;
  notes: string;
  created_at: string;
};
type Payload = { modules: Module[]; lessons: Lesson[]; reviews: Review[] };

export function LearningPublishWorkflow() {
  const [data, setData] = useState<Payload>({
    modules: [],
    lessons: [],
    reviews: [],
  });
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/learning/workflow", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok)
          throw new Error(json.error || "Gagal memuat workflow learning.");
        if (controller.signal.aborted) return;
        setData(json.data);
      })
      .catch((error: Error) => {
        if (!controller.signal.aborted) setMessage(error.message);
      });
    return () => controller.abort();
  }, []);

  async function act(moduleId: string, action: string) {
    setBusy(`${moduleId}:${action}`);
    setMessage("");
    try {
      const response = await fetch("/api/admin/learning/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module_id: moduleId, action }),
      });
      const json = await response.json();
      if (!response.ok)
        throw new Error(json.error || "Workflow gagal diproses.");
      setData(json.data);
      setMessage(
        action === "publish"
          ? "Module sudah published dan dapat muncul ke siswa."
          : action === "submit_review"
            ? "Module dikirim ke reviewer."
            : "Module dikembalikan ke draft.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Workflow gagal diproses.",
      );
    } finally {
      setBusy("");
    }
  }

  const counts = useMemo(
    () =>
      Object.fromEntries(
        ["DRAFT", "IN_REVIEW", "QA_PASSED", "PUBLISHED"].map((status) => [
          status,
          data.modules.filter((item) => item.status === status).length,
        ]),
      ),
    [data.modules],
  );

  return (
    <section className="learning-workflow-board">
      <header>
        <div>
          <span className="ops-eyebrow">PUBLISHING WORKFLOW</span>
          <h2>Draft → Review → QA Passed → Published</h2>
          <p>
            Module hanya muncul ke siswa setelah reviewer menyetujui module
            beserta seluruh lesson-nya.
          </p>
        </div>
        <div className="learning-workflow-counts">
          <span>
            <b>{counts.DRAFT || 0}</b> Draft
          </span>
          <span>
            <b>{counts.IN_REVIEW || 0}</b> Review
          </span>
          <span>
            <b>{counts.QA_PASSED || 0}</b> QA
          </span>
          <span>
            <b>{counts.PUBLISHED || 0}</b> Live
          </span>
        </div>
      </header>
      {message && (
        <div className="learning-builder-message" role="status">
          {message}
        </div>
      )}
      <div className="learning-workflow-list">
        {data.modules.map((module) => {
          const lessons = data.lessons.filter(
            (lesson) => lesson.module_id === module.id,
          );
          const review = data.reviews.find(
            (item) =>
              item.entity_type === "LEARNING_MODULE" &&
              item.entity_id === module.id,
          );
          return (
            <article key={module.id}>
              <div className="learning-workflow-main">
                <span
                  className={`learning-status status-${module.status.toLowerCase()}`}
                >
                  {module.status.replaceAll("_", " ")}
                </span>
                <strong>{module.title}</strong>
                <small>
                  {module.code} · {module.level} · {lessons.length} lesson ·{" "}
                  <Clock3 size={11} /> {module.estimated_minutes} menit
                </small>
                {review?.notes ? <p>Reviewer: {review.notes}</p> : null}
              </div>
              <div className="learning-workflow-actions">
                {module.status === "DRAFT" && (
                  <button
                    disabled={!!busy}
                    onClick={() => void act(module.id, "submit_review")}
                  >
                    <Send size={14} /> Kirim review
                  </button>
                )}
                {module.status === "QA_PASSED" && (
                  <button
                    className="publish"
                    disabled={!!busy}
                    onClick={() => void act(module.id, "publish")}
                  >
                    <UploadCloud size={14} /> Publish
                  </button>
                )}
                {module.status === "IN_REVIEW" && (
                  <span>
                    <CheckCircle2 size={14} /> Menunggu reviewer
                  </span>
                )}
                {module.status === "PUBLISHED" && (
                  <span>
                    <CheckCircle2 size={14} /> Tampil ke siswa
                  </span>
                )}
              </div>
            </article>
          );
        })}
        {!data.modules.length && (
          <p className="learning-empty">Belum ada module untuk diproses.</p>
        )}
      </div>
    </section>
  );
}
