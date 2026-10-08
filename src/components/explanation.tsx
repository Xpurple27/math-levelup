"use client";
import { Markdown } from "./markdown";
import type { Question } from "@/lib/content";
const fields = [
  ["understanding", "Understanding"],
  ["known", "Diketahui"],
  ["asked", "Ditanyakan"],
  ["concept", "Konsep"],
  ["firstStep", "Langkah pertama"],
  ["solution", "Penyelesaian"],
  ["finalAnswer", "Jawaban akhir"],
  ["shortcut", "Shortcut"],
  ["mistake", "Kesalahan umum"],
  ["optionAnalysis", "Analisis opsi"],
] as const;
export function Explanation({ value }: { value: Question["explanation"] }) {
  return (
    <div className="explanation">
      {fields.map(([key, label]) =>
        value[key] ? (
          <section key={key}>
            <strong>{label}</strong>
            <Markdown text={value[key]} />
          </section>
        ) : null,
      )}
    </div>
  );
}
