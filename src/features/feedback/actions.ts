import {
  reportCategories,
  reportPages,
  reportTopics,
} from "../../lib/feedback-rules";
import "server-only";
import * as store from "../../lib/store";
import { response, type ActionBody } from "../http";
import type { User } from "../../lib/store-types";
export async function reportIssue(b: ActionBody, user: User) {
  const { id, questionId, category, view, message } = b;
  if (
    typeof category !== "string" ||
    !reportCategories.includes(category) ||
    typeof view !== "string" ||
    !["exam", "solutions", ...reportPages].includes(view) ||
    typeof message !== "string" ||
    !message.trim() ||
    message.trim().length > 1000
  )
    return response(
      { error: "Isi laporan tidak valid (maksimal 1.000 karakter)." },
      400,
    );
  if (reportPages.includes(view as string)) {
    const topic = b.topic ?? "";
    if (
      (id !== undefined && typeof id !== "string") ||
      questionId !== undefined ||
      typeof topic !== "string" ||
      !reportTopics.includes(topic)
    )
      return response({ error: "Konteks halaman tidak valid." }, 400);
    if (typeof id === "string" && !(await store.getAttempt(id, user.id)))
      return response({ error: "Sesi tidak ditemukan." }, 404);
    await store.reportPage(
      user.id,
      category as string,
      view as string,
      topic,
      message.trim(),
      typeof id === "string" ? id : undefined,
    );
    return response({ reported: true });
  }
  if (typeof id !== "string" || typeof questionId !== "string")
    return response({ error: "Konteks soal tidak valid." }, 400);
  const attempt = await store.getAttempt(id, user.id);
  if (!attempt) return response({ error: "Sesi tidak ditemukan." }, 404);
  if (
    !attempt.snapshot.some((q) => q.id === questionId) ||
    (view === "solutions" && attempt.status !== "completed")
  )
    return response({ error: "Konteks soal tidak valid." }, 400);
  await store.reportIssue(
    user.id,
    id,
    questionId,
    String(category),
    String(view),
    message.trim(),
  );
  return response({ reported: true });
}
