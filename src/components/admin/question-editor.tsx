"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminGet, adminPost } from "./api";
import { useAdminRole } from "./shell";
import { QuestionPreview } from "./question-preview";
import {
  blankDraft,
  explanationFields,
  sourceTypes,
  type Draft,
  type Catalog,
  type QuestionDetail,
  type Media,
} from "@/features/content/model";
export function QuestionEditor({ id }: { id?: string }) {
  const role = useAdminRole(),
    router = useRouter(),
    [catalog, setCatalog] = useState<Catalog | null>(null),
    [detail, setDetail] = useState<QuestionDetail | null>(null),
    [draft, setDraft] = useState<Draft>(blankDraft()),
    [assets, setAssets] = useState<Media[]>([]),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const apply = (d: QuestionDetail) => {
    setDetail(d);
    const v = d.versions[0];
    setDraft({
      ...blankDraft(),
      ...v,
      code: d.code,
      source_type: d.source_type,
      source_title: v.source?.title || "",
      source_url: v.source?.source_url || "",
      explanation: { ...blankDraft().explanation, ...v.explanation },
      options: ["A", "B", "C", "D", "E"].map(
        (key) =>
          v.options.find((o) => o.option_key === key) || {
            option_key: key,
            content_md: "",
            is_correct: false,
          },
      ),
      version_id: v.id,
      expected_updated_at: v.updated_at,
      media_ids: v.media.map((m) => m.id),
    });
  };
  useEffect(() => {
    Promise.all([
      adminGet<Catalog>("catalog"),
      adminGet<Media[]>("media_list"),
      id ? adminGet<QuestionDetail>("detail", { id }) : Promise.resolve(null),
    ])
      .then(([c, m, d]) => {
        setCatalog(c);
        setAssets(m);
        if (d) apply(d);
        else setDraft(blankDraft(c));
      })
      .catch((e) => setError(e.message));
  }, [id]);
  const version = detail?.versions[0],
    editable = role === "ADMIN" && (!version || version.status === "DRAFT");
  const field = (key: keyof Draft, value: string) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const act = async (action: string) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (
        ["delete_draft", "archive"].includes(action) &&
        !window.confirm(
          action === "archive"
            ? "Archive logical question? Published version remains immutable."
            : "Delete this unpublished draft?",
        )
      )
        return;
      const payload =
        action === "create" || action === "save"
          ? {
              ...draft,
              options: draft.options.filter((o) => o.content_md.trim()),
            }
          : { id: detail?.id, version_id: version?.id };
      if (action === "send_qa")
        await adminPost("save", {
          ...draft,
          options: draft.options.filter((o) => o.content_md.trim()),
        });
      const d = await adminPost<
        QuestionDetail & { deleted?: boolean; archived?: boolean }
      >(action, payload);
      if (d.deleted) {
        router.push("/admin/questions");
        router.refresh();
      } else if (d.archived) {
        setNotice("Question archived.");
      } else {
        apply(d);
        setNotice(action === "publish" ? "Published." : "Tersimpan.");
        if (!id) router.replace(`/admin/questions/${d.id}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan.");
    } finally {
      setBusy(false);
    }
  };
  if (!catalog) return <p role="status">{error || "Memuat editor…"}</p>;
  const topic = catalog.topics.find(
      (t) =>
        t.id ===
        catalog.subtopics.find((s) => s.id === draft.subtopic_id)?.topic_id,
    ),
    domain = catalog.domains.find((d) => d.id === topic?.domain_id);
  return (
    <>
      <h1>{id ? "Question Editor" : "New Question"}</h1>
      <p>
        {version
          ? `Version ${version.version_number} · ${version.status}`
          : "DRAFT"}{" "}
        · {domain?.name} / {topic?.name}
      </p>
      <p role="alert">{error}</p>
      <p role="status">{notice}</p>
      <div className="tag-row">
        {editable && (
          <button
            className="button primary"
            disabled={busy}
            onClick={() => act(id ? "save" : "create")}
          >
            Save Draft
          </button>
        )}
        <a className="button secondary" href="#preview">
          Preview
        </a>
        {role === "ADMIN" && version?.status === "DRAFT" && (
          <>
            <button disabled={busy} onClick={() => act("send_qa")}>
              Send to QA
            </button>
            <button disabled={busy} onClick={() => act("delete_draft")}>
              Delete Draft
            </button>
          </>
        )}
        {role === "ADMIN" && version?.status === "QA_PASSED" && (
          <button disabled={busy} onClick={() => act("publish")}>
            Publish
          </button>
        )}
        {role === "ADMIN" &&
          version &&
          ["PUBLISHED", "QA_PASSED", "ARCHIVED"].includes(version.status) && (
            <button disabled={busy} onClick={() => act("revision")}>
              Create Revision
            </button>
          )}
        {role === "ADMIN" && detail && (
          <button disabled={busy} onClick={() => act("archive")}>
            Archive
          </button>
        )}
      </div>
      <div className="editor-grid">
        <section className="panel">
          <fieldset disabled={!editable || busy}>
            <h2>Identity / Classification</h2>
            <label>
              Code
              <input
                value={draft.code}
                disabled={!!id}
                placeholder="Optional: generated when blank"
                onChange={(e) => field("code", e.target.value)}
              />
            </label>
            <label>
              Exam / Section
              <select
                value={draft.section_id}
                onChange={(e) => field("section_id", e.target.value)}
              >
                {catalog.sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {catalog.exams.find((x) => x.id === s.exam_id)?.code} /{" "}
                    {s.code}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Domain / Topic / Subtopic
              <select
                value={draft.subtopic_id}
                onChange={(e) => field("subtopic_id", e.target.value)}
              >
                {catalog.subtopics.map((s) => {
                  const t = catalog.topics.find((t) => t.id === s.topic_id),
                    d = catalog.domains.find((d) => d.id === t?.domain_id);
                  return (
                    <option key={s.id} value={s.id}>
                      {d?.code}/{t?.code}/{s.code} — {s.name}
                    </option>
                  );
                })}
              </select>
            </label>
            <label>
              Difficulty
              <select
                value={draft.difficulty}
                onChange={(e) => field("difficulty", e.target.value)}
              >
                {["BASIC", "MEDIUM", "HARD"].map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <label>
              Primary skill
              <input
                value={draft.primary_skill || ""}
                onChange={(e) => field("primary_skill", e.target.value)}
              />
            </label>
            <h2>Question · Markdown + LaTeX</h2>
            {(["instruction_md", "stimulus_md", "stem_md"] as const).map(
              (key) => (
                <label key={key}>
                  {key}
                  <textarea
                    value={draft[key] || ""}
                    onChange={(e) => field(key, e.target.value)}
                  />
                </label>
              ),
            )}
            <h2>Options / Correct Answer</h2>
            {draft.options.map((o, i) => (
              <label key={o.option_key}>
                Option {o.option_key}
                <textarea
                  aria-label={`Option ${o.option_key}`}
                  value={o.content_md}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      options: d.options.map((item, index) =>
                        index === i
                          ? { ...item, content_md: e.target.value }
                          : item,
                      ),
                    }))
                  }
                />
                <span>
                  <input
                    aria-label={`Correct ${o.option_key}`}
                    type="radio"
                    name="correct"
                    checked={o.is_correct}
                    onChange={() =>
                      setDraft((d) => ({
                        ...d,
                        options: d.options.map((item, index) => ({
                          ...item,
                          is_correct: index === i,
                        })),
                      }))
                    }
                  />
                  Correct answer
                </span>
              </label>
            ))}
            <h2>Explanation V2</h2>
            {explanationFields.map(([key, label, required]) => (
              <label key={key}>
                {label}
                {required ? " *" : ""}
                <textarea
                  value={draft.explanation[key] || ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      explanation: { ...d.explanation, [key]: e.target.value },
                    }))
                  }
                />
              </label>
            ))}
            <h2>Media references</h2>
            {assets.length ? (
              assets.map((m) => (
                <label key={m.id}>
                  <input
                    type="checkbox"
                    checked={draft.media_ids.includes(m.id)}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        media_ids: e.target.checked
                          ? [...d.media_ids, m.id]
                          : d.media_ids.filter((id) => id !== m.id),
                      }))
                    }
                  />
                  {m.original_filename} · {m.storage_path}
                </label>
              ))
            ) : (
              <p>
                Belum ada media. Daftarkan object storage yang sudah diunggah di
                Media references.
              </p>
            )}
            <h2>Source</h2>
            <label>
              Source type
              <select
                value={draft.source_type}
                onChange={(e) => field("source_type", e.target.value)}
              >
                {sourceTypes.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              Source title
              <input
                value={draft.source_title || ""}
                placeholder={
                  version?.source_id
                    ? "Existing source retained unless replaced"
                    : ""
                }
                onChange={(e) => field("source_title", e.target.value)}
              />
            </label>
            <label>
              Source page
              <input
                value={draft.source_page || ""}
                onChange={(e) => field("source_page", e.target.value)}
              />
            </label>
            <label>
              Source reference URL
              <input
                value={draft.source_url || ""}
                onChange={(e) => field("source_url", e.target.value)}
              />
            </label>
          </fieldset>
          <h2>QA / version history</h2>
          {detail?.versions.map((v) => (
            <div key={v.id}>
              <p>
                Version {v.version_number} · {v.status}
              </p>
              {v.reviews.map((r, i) => (
                <p key={i}>
                  {r.status}: {r.notes}
                </p>
              ))}
            </div>
          ))}
        </section>
        <div id="preview">
          <QuestionPreview draft={draft} media={assets} />
        </div>
      </div>
    </>
  );
}
