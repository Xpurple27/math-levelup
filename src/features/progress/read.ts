import "server-only";
import { publicMastery } from "@/lib/scoring";
import * as store from "@/lib/store";
import { response } from "../http";
export async function progressResponse(user: store.User) {
  try {
    const progress = await store.progress(user.id);
    return response({
      user,
      ...progress,
      mastery: progress.mastery.map(publicMastery),
    });
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
}
