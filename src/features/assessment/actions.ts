import "server-only";
import {
  selectQuestions,
  publicQuestion,
  type Difficulty,
} from "@/lib/content";
import { grade, updateMastery } from "@/lib/scoring";
import * as store from "@/lib/store";
import { findTryoutPackage, tryoutPackages } from "@/lib/tryout-packages";
import { publicTopics } from "../content/runtime";
import { response, type ActionBody } from "../http";
import { applyPracticeAnswer } from "../practice/answer";
export async function finish(a: store.Attempt) {
  if (a.status === "completed") return a;
  const old = await store.getMastery(a.user_id);
  const masteries = [...new Set(a.snapshot.map((q) => q.topic))].flatMap(
    (topic) => {
      const qs = a.snapshot.filter((q) => q.topic === topic);
      return qs.length
        ? [
            updateMastery(
              old.find((m) => m.topic === topic),
              qs,
              a.answers,
              a.kind,
              a.credits,
            ),
          ]
        : [];
    },
  );
  await store.finalize(a, grade(a.snapshot, a.answers), masteries, old);
  return (await store.getAttempt(a.id, a.user_id))!;
}
export function safe(a: store.Attempt) {
  return {
    id: a.id,
    kind: a.kind,
    topic: a.topic,
    started: a.started,
    deadline: a.deadline,
    status: a.status,
    answers: a.answers,
    result: a.result,
    feedback: a.feedback,
    serverNow: Date.now(),
    questions: a.snapshot.map((q) => ({
      ...publicQuestion(q),
      ...(a.status === "completed" || a.feedback[q.id]?.done
        ? { correct: q.correct, explanation: q.explanation, media: q.media }
        : {}),
      ...(a.kind === "guided" &&
      a.feedback[q.id]?.tries === 1 &&
      !a.feedback[q.id].done
        ? { hint: q.hint }
        : {}),
    })),
  };
}
export async function expire(a: store.Attempt) {
  return a.status === "active" && a.deadline && Date.now() >= a.deadline
    ? finish(a)
    : a;
}

export async function assessmentAction(b: ActionBody, user: store.User) {
  if (b.action === "start") {
    if (
      typeof b.kind !== "string" ||
      !["diagnostic", "guided", "mini", "practice", "tryout"].includes(b.kind)
    )
      return response({ error: "Jenis sesi tidak valid." }, 400);
    const pack =
      b.kind === "tryout"
        ? findTryoutPackage(
            typeof b.packageSlug === "string" ? b.packageSlug : null,
          )
        : undefined;
    if (
      b.kind === "tryout" &&
      (!pack ||
        pack.access !== "FREE" ||
        !tryoutPackages.some((p) => p.slug === pack.slug))
    )
      return response(
        { error: "Paket tidak tersedia atau belum dapat diakses." },
        400,
      );
    const topic = b.kind === "diagnostic" ? null : pack ? pack.slug : b.topic;
    if (
      topic !== null &&
      (typeof topic !== "string" ||
        (!pack && !(await publicTopics()).some((t) => t.id === topic)))
    )
      return response({ error: "Topik tidak valid." }, 400);
    const count =
      typeof b.count === "number" && [5, 10, 15, 20].includes(b.count)
        ? b.count
        : 5;
    const difficulty = b.difficulty ?? "Mixed";
    if (
      typeof difficulty !== "string" ||
      !["Basic", "Medium", "Hard", "Mixed"].includes(difficulty)
    )
      return response({ error: "Tingkat kesulitan tidak valid." }, 400);
    if (b.kind === "practice" && difficulty !== "Mixed" && count > 10)
      return response(
        { error: "Untuk satu tingkat kesulitan, pilih 5 atau 10 soal." },
        400,
      );
    let a = await store.activeAttempt(user.id, b.kind, topic);
    if (a) a = await expire(a);
    if (!a || a.status === "completed") {
      const excludedIds = pack ? [] : await store.seenQuestionIds(user.id);
      a = await store.createAttempt(
        user.id,
        b.kind,
        topic,
        await selectQuestions(b.kind, topic ?? undefined, count, {
          difficulty: difficulty as Difficulty | "Mixed",
          excludedIds,
          section: typeof b.section === "string" ? b.section : undefined,
        }),
      );
    }
    return response({ attempt: safe(a) });
  }
  let a =
    typeof b.id === "string" ? await store.getAttempt(b.id, user.id) : null;
  if (!a) return response({ error: "Sesi tidak ditemukan." }, 404);
  a = await expire(a);
  if (b.action === "submit") {
    if (
      a.status === "active" &&
      (a.kind === "guided" || a.kind === "practice") &&
      a.snapshot.some((q) => !a!.feedback[q.id]?.done)
    )
      return response(
        { error: "Selesaikan semua soal sebelum mengakhiri sesi." },
        400,
      );
    return response({ attempt: safe(await finish(a)) });
  }
  if (b.action !== "answer")
    return response({ error: "Aksi tidak valid." }, 400);
  if (a.status !== "active") return response({ attempt: safe(a) });
  const q = a.snapshot.find((q) => q.id === b.questionId);
  if (
    !q ||
    typeof b.selected !== "number" ||
    !Number.isInteger(b.selected) ||
    b.selected < 0 ||
    b.selected >= q.options.length
  )
    return response({ error: "Jawaban tidak valid." }, 400);
  if (a.kind === "practice" || a.kind === "guided") {
    if (!applyPracticeAnswer(a, q, b.selected))
      return response({ attempt: safe(a) });
  } else a.answers[q.id] = b.selected;
  await store.saveAttempt(a);
  return response({ attempt: safe(a) });
}
