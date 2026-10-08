"use client";
import { ContentMedia } from "../content-media";
import type { Media } from "@/features/content/model";
import { Markdown } from "../markdown";
import { explanationFields, type Draft } from "@/features/content/model";
export function QuestionPreview({
  draft,
  media = [],
}: {
  draft: Draft;
  media?: Media[];
}) {
  return (
    <section
      className="panel question-preview"
      aria-label="Student-style preview"
    >
      <h2>Preview</h2>
      <ContentMedia
        media={media
          .filter((m) => draft.media_ids.includes(m.id))
          .map((m) => ({
            id: m.id,
            kind: m.kind,
            url: m.url || "",
            alt: m.alt_text || m.original_filename,
          }))}
      />
      <Markdown text={draft.instruction_md} />
      <Markdown text={draft.stimulus_md} />
      <Markdown text={draft.stem_md} />
      {draft.options
        .filter((o) => o.content_md)
        .map((o) => (
          <div className="preview-option" key={o.option_key}>
            <strong>{o.option_key}</strong>
            <Markdown text={o.content_md} />
          </div>
        ))}
      <p>
        Admin-only key:{" "}
        {draft.options.find((o) => o.is_correct)?.option_key || "Belum dipilih"}
      </p>
      {explanationFields.map(([key, label]) =>
        draft.explanation[key] ? (
          <div key={key}>
            <h3>{label}</h3>
            <Markdown text={draft.explanation[key]} />
          </div>
        ) : null,
      )}
    </section>
  );
}
