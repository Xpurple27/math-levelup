import { NextRequest } from "next/server";
import * as store from "@/lib/store";
import { response, cookie, type ActionBody } from "@/features/http";
import { authenticateAction, logoutAction } from "@/features/auth/actions";
import { assessmentAction, safe, expire } from "@/features/assessment/actions";
import { progressResponse } from "@/features/progress/read";
export const runtime = "nodejs";
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
    return await progressResponse(user);
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
    const b = (await req.json()) as ActionBody;
    if (!b || typeof b.action !== "string")
      return response({ error: "Permintaan tidak valid." }, 400);
    if (b.action === "register" || b.action === "login")
      return await authenticateAction(req, b, origin!);
    const token = req.cookies.get(cookie)?.value;
    const user = await store.getUser(token);
    if (!user)
      return response({ error: "Silakan masuk terlebih dahulu." }, 401);
    if (b.action === "logout") return await logoutAction(token || "");
    return await assessmentAction(b, user);
  } catch (error) {
    if (error instanceof Error && "status" in error)
      return response({ error: error.message }, Number(error.status));
    return response(
      { error: "Permintaan gagal diproses. Silakan coba lagi." },
      400,
    );
  }
}
