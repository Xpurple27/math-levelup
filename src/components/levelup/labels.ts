"use client";
import { useTopics } from "../content-context";
export const kindLabel: Record<string, string> = {
  diagnostic: "Diagnostik awal",
  tryout: "Tryout paket",
  guided: "Latihan terbimbing",
  mini: "Mini assessment",
  practice: "Latihan mandiri",
};
export const topicName = (id: string | null) =>
  id ? "Subtopik" : "PK · PM · PU";

export function useTopicName() {
  const topics = useTopics();
  return (id: string | null) =>
    topics.find((t) => t.id === id)?.name || topicName(id);
}
