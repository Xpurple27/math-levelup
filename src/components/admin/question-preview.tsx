"use client";
import { ContentMedia } from "../content-media";
import { Markdown } from "../markdown";
import {
  explanationFields,
  type Draft,
  type Media,
} from "@/features/content/model";
export function QuestionPreview({
  draft,
  media = [],
}: {
  draft: Draft;
  media?: Media[];
}) {
  const ids = Array.isArray(draft.media_ids) ? draft.media_ids : [],
    visible = ids.length ? media.filter((m) => ids.includes(m.id)) : media,
    correct = draft.options
      .filter((o) => o.is_correct)
      .map((o) => o.option_key);
  return (
    <section
      className="panel question-preview"
      aria-label="Preview soal lengkap"
    >
      <div className="preview-title-row">
        <h2>Preview</h2>
        <span className="status-chip">
          {(draft.question_type || "SINGLE_CHOICE").replaceAll("_", " ")}
        </span>
      </div>
      <ContentMedia
        media={visible.map((m) => ({
          id: m.id,
          kind: m.kind,
          url: m.url || "",
          alt: m.alt_text || m.original_filename,
        }))}
      />
      <Markdown text={draft.instruction_md} />
      <Markdown text={draft.stimulus_md} />
      <Markdown text={draft.stem_md} />
      <div className="preview-options-block">
        {draft.options
          .filter((o) => o.content_md)
          .map((o, i) => (
            <div
              className={`preview-option ${o.is_correct ? "is-key" : ""}`}
              key={o.option_key}
            >
              <strong>
                {draft.question_type === "TRUE_FALSE" ? i + 1 : o.option_key}
              </strong>
              <Markdown text={o.content_md} />
              {draft.question_type === "TRUE_FALSE" && (
                <span className="answer-key-chip">
                  {o.is_correct ? "Benar" : "Salah"}
                </span>
              )}
            </div>
          ))}
      </div>
      {draft.question_type !== "TRUE_FALSE" && (
        <div className="preview-answer-key">
          <strong>Kunci:</strong>{" "}
          {correct.length ? correct.join(", ") : "Belum dipilih"}
        </div>
      )}
      <div className="preview-explanation">
        <h2>Pembahasan</h2>
        {explanationFields.map(([key, label]) =>
          draft.explanation[key] ? (
            <div className="preview-explanation-section" key={key}>
              <h3>{label}</h3>
              <Markdown text={draft.explanation[key]} />
            </div>
          ) : null,
        )}
      </div>
    </section>
  );
}
