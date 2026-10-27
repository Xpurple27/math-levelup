"use client";
import { useTopics } from "../content-context";

export const kindLabel: Record<string, string> = {
  diagnostic: "VECTRA Diagnostic",
  tryout: "VECTRA Assessment",
  guided: "Guided Practice",
  mini: "Checkpoint",
  practice: "VECTRA Practice",
};

export const topicName = (id: string | null) =>
  id ? "Subtopik" : "PK · PM · PU";

export function useTopicName() {
  const topics = useTopics();
  return (id: string | null) =>
    topics.find((t) => t.id === id)?.name || topicName(id);
}
