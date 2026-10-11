import { cookies } from "next/headers";
import { cookie } from "@/features/http";
import { getUser } from "@/lib/store";
import { listPracticePackages } from "@/features/practice/packages";

export const runtime = "nodejs";

export async function GET() {
  try {
    const token = (await cookies()).get(cookie)?.value;
    const user = await getUser(token);
    if (!user) return Response.json({ error: "Masuk terlebih dahulu." }, { status: 401 });

    return Response.json(
      { data: await listPracticePackages() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ error: "Paket latihan belum dapat dimuat." }, { status: 500 });
  }
}
