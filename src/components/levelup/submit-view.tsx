"use client";
import type { Attempt } from "./types";
import type { Dispatch, SetStateAction } from "react";
type Props = {
  answered: number;
  attempt: Attempt;
  error: string;
  setConfirm: Dispatch<SetStateAction<boolean>>;
  busy: boolean;
  submit: () => Promise<void>;
};
export function SubmitDialog({
  answered,
  attempt,
  error,
  setConfirm,
  busy,
  submit,
}: Props) {
  return (
    <div className="modal-backdrop">
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="submit-title"
      >
        <h2 id="submit-title">Selesaikan sesi?</h2>
        <p>
          {answered} dari {attempt.questions.length} soal tersimpan.{" "}
          {attempt.questions.length - answered > 0
            ? "Soal yang kosong akan dicatat sebagai belum dijawab."
            : "Kamu sudah menjawab semua soal."}
        </p>
        <p className="muted">Setelah dikirim, jawaban tidak dapat diubah.</p>
        {error && <p className="form-error">{error}</p>}
        <div className="question-nav">
          <button
            className="button secondary"
            onClick={() => setConfirm(false)}
          >
            Periksa lagi
          </button>
          <button
            className="button primary"
            disabled={busy}
            onClick={() => void submit()}
          >
            Kirim jawaban
          </button>
        </div>
      </section>
    </div>
  );
}
