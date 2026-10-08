export const reportCategories = [
  "question",
  "answer",
  "explanation",
  "technical",
  "display",
  "suggestion",
];
export const reportPages = [
  "dashboard",
  "learn",
  "progress",
  "result",
  "practice",
  "tryout",
];
export const reportTopics = [
  "",
  "rasio",
  "aljabar",
  "statistika",
  "persen",
  "geometri",
  "peluang",
  "pola",
];

export function validReportTopic(topic: string) {
  return (
    reportTopics.includes(topic) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      topic,
    )
  );
}
