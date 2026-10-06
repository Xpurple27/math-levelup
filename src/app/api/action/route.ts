import { NextRequest, NextResponse } from "next/server";
import { topics, selectQuestions, publicQuestion } from "@/lib/content";
import { grade, updateMastery } from "@/lib/scoring";
import * as store from "@/lib/store";
import { onlineBackend } from "@/lib/backend";
export const runtime = "nodejs";
const cookie = "levelup_session";
const limits = new Map<string, { count: number; until: number }>();
async function finish(a: store.Attempt) {
  if (a.status === "completed") return a;
  const old = await store.getMastery(a.user_id);
  const masteries = topics.flatMap((t) => {
    const qs = a.snapshot.filter((q) => q.topic === t.id);
    return qs.length
      ? [
          updateMastery(
            old.find((m) => m.topic === t.id),
            qs,
            a.answers,
            a.kind,
            a.credits,
          ),
        ]
      : [];
  });
  await store.finalize(a, grade(a.snapshot, a.answers), masteries, old);
  return (await store.getAttempt(a.id, a.user_id))!;
}
function safe(a: store.Attempt) {
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
        ? { correct: q.correct, explanation: q.explanation }
        : {}),
      ...(a.kind === "guided" &&
      a.feedback[q.id]?.tries === 1 &&
      !a.feedback[q.id].done
        ? { hint: q.hint }
        : {}),
    })),
  };
}
async function expire(a: store.Attempt) {
  return a.status === "active" && a.deadline && Date.now() >= a.deadline
    ? finish(a)
    : a;
}
function response(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(
    { ...data, backend: onlineBackend() ? "supabase" : "local" },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
export async function GET(req: NextRequest) {
  try {
    const user = await store.getUser(req.cookies.get(cookie)?.value);
    if (!user) return response({ user: null });
    const id = req.nextUrl.searchParams.get("attempt");
    if (id) {
      const a = await store.getAttempt(id, user.id);
      if (!a) return response({ error: "Sesi tidak ditemukan." }, 404);
      return response({ attempt: safe(await expire(a)) });
    }
    try {
      return response({ user, ...(await store.progress(user.id)) });
    } catch {
      return response({
        user,
        mastery: [],
        history: [],
        days: [],
        streak: 0,
        notice:
          "Penyimpanan belajar belum tersedia. Coba lagi setelah pengelola menyelesaikan pengaturan.",
      });
    }
  } catch {
    return response({
      user: null,
      notice: "Akun online belum tersedia. Materi tetap bisa dijelajahi.",
    });
  }
}
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  try {
    if (!origin) throw new Error("Missing Origin");
    const source = new URL(origin);
    if (
      !["http:", "https:"].includes(source.protocol) ||
      source.host !== req.headers.get("host")
    )
      throw new Error("Invalid Origin");
  } catch {
    return response({ error: "Permintaan lintas situs ditolak." }, 403);
  }
  try {
    const b = await req.json();
    if (!b || typeof b.action !== "string")
      return response({ error: "Permintaan tidak valid." }, 400);
    if (b.action === "register" || b.action === "login") {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "local";
      const prior = limits.get(ip);
      if (prior && prior.until > Date.now() && prior.count >= 20)
        return response(
          { error: "Terlalu banyak percobaan. Coba lagi dalam 15 menit." },
          429,
        );
      limits.set(ip, {
        count: prior && prior.until > Date.now() ? prior.count + 1 : 1,
        until:
          prior && prior.until > Date.now() ? prior.until : Date.now() + 900000,
      });
      if (
        typeof b.email !== "string" ||
        typeof b.password !== "string" ||
        b.password.length > 200
      )
        return response({ error: "Email atau kata sandi tidak valid." }, 400);
      const email = b.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
        return response({ error: "Masukkan email yang valid." }, 400);
      let user: store.User | null;
      if (b.action === "register") {
        if (
          typeof b.name !== "string" ||
          b.name.trim().length < 2 ||
          b.name.length > 80 ||
          b.password.length < 8
        )
          return response(
            {
              error:
                "Nama minimal 2 karakter dan kata sandi minimal 8 karakter.",
            },
            400,
          );
        const goal = Number(b.goal || 700);
        if (!Number.isInteger(goal) || goal < 100 || goal > 1000)
          return response({ error: "Target skor harus 100–1000." }, 400);
        const level = ["Kelas 11", "Kelas 12", "Gap year"].includes(b.grade)
          ? b.grade
          : "Kelas 12";
        try {
          const registered = await store.register(
            email,
            b.name.trim(),
            b.password,
            level,
            goal,
            origin!,
          );
          if (registered.confirmationRequired)
            return response({ confirmationRequired: true });
          user = registered.user;
        } catch (error) {
          if (error instanceof Error && "status" in error)
            return response({ error: error.message }, Number(error.status));
          return response(
            { error: "Email sudah terdaftar. Silakan masuk." },
            409,
          );
        }
      } else user = await store.authenticate(email, b.password);
      if (!user)
        return response({ error: "Email atau kata sandi tidak cocok." }, 401);
      const r = response({ user });
      const session = await store.newSession(user.id);
      if (session)
        r.cookies.set(cookie, session, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 604800,
        });
      return r;
    }
    const token = req.cookies.get(cookie)?.value,
      user = await store.getUser(token);
    if (!user)
      return response({ error: "Silakan masuk terlebih dahulu." }, 401);
    if (b.action === "logout") {
      await store.logout(token || "");
      const r = response({ ok: true });
      r.cookies.delete(cookie);
      return r;
    }
    if (b.action === "start") {
      if (!["diagnostic", "guided", "mini", "practice"].includes(b.kind))
        return response({ error: "Jenis sesi tidak valid." }, 400);
      const topic = b.kind === "diagnostic" ? null : b.topic;
      if (topic !== null && !topics.some((t) => t.id === topic))
        return response({ error: "Topik tidak valid." }, 400);
      const count = [5, 10, 15, 20].includes(b.count) ? b.count : 5;
      const difficulty = b.difficulty ?? "Mixed";
      if (!["Basic", "Medium", "Hard", "Mixed"].includes(difficulty))
        return response({ error: "Tingkat kesulitan tidak valid." }, 400);
      if (b.kind === "practice" && difficulty !== "Mixed" && count > 10)
        return response(
          { error: "Untuk satu tingkat kesulitan, pilih 5 atau 10 soal." },
          400,
        );
      let a = await store.activeAttempt(user.id, b.kind, topic);
      if (a) a = await expire(a);
      if (!a || a.status === "completed") {
        const excludedIds = await store.seenQuestionIds(user.id);
        a = await store.createAttempt(
          user.id,
          b.kind,
          topic,
          selectQuestions(b.kind, topic ?? undefined, count, {
            difficulty,
            excludedIds,
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
      !Number.isInteger(b.selected) ||
      b.selected < 0 ||
      b.selected >= q.options.length
    )
      return response({ error: "Jawaban tidak valid." }, 400);
    if (a.kind === "practice" || a.kind === "guided") {
      const previous = a.feedback[q.id];
      if (previous?.done) return response({ attempt: safe(a) });
      const tries = (previous?.tries ?? 0) + 1,
        correct = b.selected === q.correct,
        done = correct || a.kind === "practice" || tries >= 2;
      a.feedback[q.id] = { tries, done, correct, selected: b.selected };
      if (done) {
        a.answers[q.id] = b.selected;
        a.credits[q.id] = tries > 1 ? 0.5 : 1;
      }
    } else a.answers[q.id] = b.selected;
    await store.saveAttempt(a);
    return response({ attempt: safe(a) });
  } catch (error) {
    if (error instanceof Error && "status" in error)
      return response({ error: error.message }, Number(error.status));
    return response(
      { error: "Permintaan gagal diproses. Silakan coba lagi." },
      400,
    );
  }
}
