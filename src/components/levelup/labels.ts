import { topics } from "@/lib/topics";
import { findTryoutPackage } from "@/lib/tryout-packages";
export const kindLabel: Record<string, string> = {
  diagnostic: "Diagnostik awal",
  tryout: "Tryout paket",
  guided: "Latihan terbimbing",
  mini: "Mini assessment",
  practice: "Latihan mandiri",
};
export const topicName = (id: string | null) =>
  findTryoutPackage(id)?.title ||
  topics.find((t) => t.id === id)?.name ||
  "PK · PM · PU";
