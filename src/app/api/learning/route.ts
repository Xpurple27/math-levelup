import { cookies } from "next/headers";
import { cookie } from "@/features/http";
import { getUser } from "@/lib/store";
import { loadPublishedLearning } from "@/features/learning/read";

export const runtime = "nodejs";

export async function GET() {
  try {
    const token = (await cookies()).get(cookie)?.value;
    const user = await getUser(token);
    if (!user)
      return Response.json(
        { error: "Masuk terlebih dahulu." },
        { status: 401 },
      );

    return Response.json(
      { data: await loadPublishedLearning() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Learning API failed", error);
    return Response.json(
      { error: "Materi belajar belum dapat dimuat." },
      { status: 500 },
    );
  }
}
