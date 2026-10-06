import "server-only";
import { bank } from "./content";
import { findTryoutPackage } from "./tryout-packages";
// Fixed assignments from the shared seed bank, pinned to exact versions.
// These free beta sets are noncompetitive and not protected commercial questions.
const assignments: Record<string, string[]> = {
  "pk-01-v1": [
    "rasio-1",
    "rasio-2",
    "rasio-13",
    "rasio-14",
    "rasio-25",
    "persen-f1-v1",
    "persen-f2-v1",
    "persen-f5-v1",
    "persen-f6-v1",
    "persen-f9-v1",
    "geometri-f1-v1",
    "geometri-f2-v1",
    "geometri-f5-v1",
    "geometri-f6-v1",
    "geometri-f9-v1",
  ],
  "pm-01-v1": [
    "aljabar-1",
    "aljabar-2",
    "aljabar-3",
    "aljabar-13",
    "aljabar-14",
    "aljabar-15",
    "aljabar-25",
    "aljabar-26",
    "peluang-f1-v1",
    "peluang-f2-v1",
    "peluang-f5-v1",
    "peluang-f6-v1",
    "peluang-f7-v1",
    "peluang-f9-v1",
    "peluang-f10-v1",
  ],
  "pu-01-v1": [
    "statistika-1",
    "statistika-2",
    "statistika-3",
    "statistika-13",
    "statistika-14",
    "statistika-15",
    "statistika-25",
    "statistika-26",
    "pola-f1-v1",
    "pola-f2-v1",
    "pola-f5-v1",
    "pola-f6-v1",
    "pola-f7-v1",
    "pola-f9-v1",
    "pola-f10-v1",
  ],
};
// Revision 2 extends each frozen revision-one assignment; no previous set changes.
assignments["pk-01-v2"] = [
  ...assignments["pk-01-v1"],
  "rasio-26",
  "persen-f7-v1",
  "persen-f10-v1",
  "geometri-f7-v1",
  "geometri-f10-v1",
];
assignments["pm-01-v2"] = [
  ...assignments["pm-01-v1"],
  "aljabar-16",
  "aljabar-27",
  "peluang-f3-v1",
  "peluang-f8-v1",
  "peluang-f11-v1",
];
assignments["pu-01-v2"] = [
  ...assignments["pu-01-v1"],
  "statistika-16",
  "statistika-27",
  "pola-f3-v1",
  "pola-f8-v1",
  "pola-f11-v1",
];
export function tryoutQuestions(slug: string) {
  const pack = findTryoutPackage(slug);
  if (!pack || !assignments[slug]) throw new Error("Paket tidak tersedia.");
  const questions = assignments[slug].map((id) => {
    const question = bank.find((q) => q.id === id && q.version === 1);
    if (!question || question.section !== pack.section)
      throw new Error("Versi soal paket tidak tersedia.");
    return question;
  });
  if (questions.length !== pack.questionCount)
    throw new Error("Isi paket tidak lengkap.");
  return questions;
}
