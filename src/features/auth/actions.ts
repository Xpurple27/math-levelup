import "server-only";
import type { NextRequest } from "next/server";
import * as store from "@/lib/store";
import { response, cookie, type ActionBody } from "../http";
const limits = new Map<string, { count: number; until: number }>();
export async function authenticateAction(
  req: NextRequest,
  b: ActionBody,
  origin: string,
) {
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
          error: "Nama minimal 2 karakter dan kata sandi minimal 8 karakter.",
        },
        400,
      );
    const goal = Number(b.goal || 700);
    if (!Number.isInteger(goal) || goal < 100 || goal > 1000)
      return response({ error: "Target skor harus 100–1000." }, 400);
    const level = ["Kelas 11", "Kelas 12", "Gap year"].includes(
      b.grade as string,
    )
      ? (b.grade as string)
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
      return response({ error: "Email sudah terdaftar. Silakan masuk." }, 409);
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
export async function logoutAction(token: string) {
  await store.logout(token);
  const r = response({ ok: true });
  r.cookies.delete(cookie);
  return r;
}
