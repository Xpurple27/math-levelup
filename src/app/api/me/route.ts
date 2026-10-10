import { cookies } from "next/headers";
import { cookie, response } from "@/features/http";
import { getUser } from "@/lib/store";
import { adminContent } from "@/features/content/db";
import type { Role } from "@/features/content/model";

export const runtime = "nodejs";

export async function GET() {
  const token = (await cookies()).get(cookie)?.value;
  const user = await getUser(token);
  if (!user) return response({ error: "Belum masuk." }, 401);

  let role: Role = "STUDENT";
  try {
    const result = await adminContent<{ role: Role }>(user.id, "role");
    role = result.role;
  } catch {
    role = "STUDENT";
  }

  return response({ user, role });
}
