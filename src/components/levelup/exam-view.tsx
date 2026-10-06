"use client";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { kindLabel, topicName } from "./labels";
import type { View, Q, Attempt, ActionReply } from "./types";
import type { Dispatch, SetStateAction } from "react";
type Props = {
  attempt: Attempt;
  time: number;
  timeText: string;
  index: number;
  q: Q;
  selected: number | undefined;
  busy: boolean;
  feedback:
    | { tries: number; done: boolean; correct: boolean; selected: number }
    | undefined;
  call: (data: Record<string, unknown>) => Promise<ActionReply | null>;
  syncAttempt: (a: Attempt) => void;
  setIndex: Dispatch<SetStateAction<number>>;
  setConfirm: Dispatch<SetStateAction<boolean>>;
  answered: number;
  go: (v: View) => void;
};
export function ExamView({
  attempt,
  time,
  timeText,
  index,
  q,
  selected,
  busy,
  feedback,
  call,
  syncAttempt,
  setIndex,
  setConfirm,
  answered,
  go,
}: Props) {
  return (
    <>
      <div className="exam-heading">
        <div>
          <span className="eyebrow purple-text">
            {kindLabel[attempt.kind]} · {topicName(attempt.topic)}
          </span>
          <h1>Satu soal, satu langkah.</h1>
        </div>
        <span
          className={`timer ${attempt.deadline && time < 120 ? "urgent" : ""}`}
        >
          <Clock size={18} />
          {attempt.deadline ? "Sisa waktu" : "Waktu berjalan"}{" "}
          <strong>{timeText}</strong>
        </span>
      </div>
      <div className="exam-grid">
        <section className="panel question-panel">
          <div className="section-heading">
            <span className="muted">
              Soal {index + 1} dari {attempt.questions.length}
            </span>
            <span className="tag">
              {q.section} · {q.difficulty}
            </span>
          </div>
          <div className="question-progress">
            <span
              style={{
                width: `${((index + 1) / attempt.questions.length) * 100}%`,
              }}
            />
          </div>
          <h2 className="question-stem">{q.stem}</h2>
          <div className="answer-options">
            {q.options.map((o, i) => (
              <button
                aria-label={`Pilihan ${String.fromCharCode(65 + i)}: ${o}`}
                className={`answer ${selected === i ? "chosen" : ""} ${q.correct === i ? "right" : ""}`}
                key={i}
                disabled={busy || !!feedback?.done}
                onClick={async () => {
                  const d = await call({
                    action: "answer",
                    id: attempt.id,
                    questionId: q.id,
                    selected: i,
                  });
                  if (d?.attempt) syncAttempt(d.attempt);
                }}
              >
                <span>{String.fromCharCode(65 + i)}</span>
                {o}
                {selected === i && <CheckCircle2 size={19} />}
              </button>
            ))}
          </div>
          {busy && (
            <div className="save-status" role="status">
              Menyimpan…
            </div>
          )}
          {selected !== undefined && !busy && (
            <div className="save-status">
              <Check size={13} />
              Tersimpan di server
            </div>
          )}
          {q.hint && (
            <div className="hint">
              <strong>Belum tepat. Coba sekali lagi.</strong>
              <p>{q.hint}</p>
            </div>
          )}
          {q.explanation && (
            <div className="explanation">
              <h3>
                {feedback?.correct ? "Tepat!" : "Mari pahami langkahnya."}
              </h3>
              <strong>Langkah pertama</strong>
              <p>{q.explanation.firstStep}</p>
              <strong>Penyelesaian</strong>
              <p>{q.explanation.solution}</p>
              <small>Hindari: {q.explanation.mistake}</small>
            </div>
          )}
          <div className="question-nav">
            <button
              className="button secondary"
              disabled={index === 0 || busy}
              onClick={() => setIndex((i) => i - 1)}
            >
              <ChevronLeft size={17} />
              Sebelumnya
            </button>
            {index < attempt.questions.length - 1 ? (
              <button
                className="button primary"
                disabled={
                  busy ||
                  ((attempt.kind === "guided" || attempt.kind === "practice") &&
                    !feedback?.done)
                }
                onClick={() => setIndex((i) => i + 1)}
              >
                Berikutnya
                <ChevronRight size={17} />
              </button>
            ) : (
              <button
                className="button primary"
                disabled={busy}
                onClick={() => setConfirm(true)}
              >
                Selesaikan sesi
                <Check size={17} />
              </button>
            )}
          </div>
        </section>
        <aside className="panel exam-sidebar">
          <h3>Navigasi soal</h3>
          <div className="question-dots">
            {attempt.questions.map((item, i) => (
              <button
                aria-label={`Buka soal ${i + 1}`}
                className={`${attempt.answers[item.id] !== undefined ? "answered" : ""} ${index === i ? "current" : ""}`}
                onClick={() => setIndex(i)}
                key={item.id}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <p className="muted small-text">
            {answered}/{attempt.questions.length} jawaban tersimpan
          </p>
          <div className="info-box">
            {attempt.kind === "diagnostic" ||
            attempt.kind === "mini" ||
            attempt.kind === "tryout"
              ? "Tidak ada petunjuk atau umpan balik selama asesmen. Kamu bisa meninjau jawaban sebelum mengirim."
              : "Baca pembahasan sebelum melanjutkan. Jawaban latihan mandiri tidak bisa diulang."}
          </div>
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => setConfirm(true)}
          >
            Selesaikan sesi
          </button>
          <button className="text-button" onClick={() => go("dashboard")}>
            Simpan & kembali
          </button>
        </aside>
      </div>
    </>
  );
}
