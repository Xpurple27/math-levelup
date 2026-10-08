import "server-only";
import { cookies } from "next/headers";
import { getUser } from "../../lib/store";
import { cookie } from "../http";
import { adminContent } from "./db";
import type { Role } from "./model";
import { StorageError } from "../../lib/store-errors";
export async function adminIdentity() {
  const user = await getUser((await cookies()).get(cookie)?.value);
  if (!user) throw new StorageError("Masuk terlebih dahulu.", 401);
  const { role } = await adminContent<{ role: Role }>(user.id, "role");
  if (role === "STUDENT") throw new StorageError("Akses admin ditolak.", 403);
  return { user, role };
}
export function assertOrigin(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (!origin) throw new Error();
    const source = new URL(origin);
    if (
      !["http:", "https:"].includes(source.protocol) ||
      source.host !== (request.headers.get("host") || new URL(request.url).host)
    )
      throw new Error();
  } catch {
    throw new StorageError("Permintaan lintas situs ditolak.", 403);
  }
}
export function adminError(error: unknown) {
  const e =
    error instanceof StorageError
      ? error
      : new StorageError("Permintaan konten gagal.", 400);
  return Response.json(
    { error: e.message },
    { status: e.status, headers: { "Cache-Control": "no-store" } },
  );
}
