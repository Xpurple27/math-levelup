import "server-only";
import { loadPublishedLearning } from "./read";

export async function publishedLearningCoverage(): Promise<string[]> {
  const data = await loadPublishedLearning();
  return [...new Set(data.modules.map((module) => String(module.subtopic_id)))];
}
