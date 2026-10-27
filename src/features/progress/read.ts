import "server-only";

import { publicMastery } from "@/lib/scoring";
import * as store from "@/lib/store";
import { publishedLearningCoverage } from "../learning/catalog";
import { response } from "../http";

export async function progressResponse(user: store.User) {
  try {
    const [progress, learningCoverage] = await Promise.all([
      store.progress(user.id),
      publishedLearningCoverage(),
    ]);
    return response({
      user,
      ...progress,
      mastery: progress.mastery.map(publicMastery),
      learningCoverage,
    });
  } catch {
    return response({
      user,
      mastery: [],
      history: [],
      days: [],
      streak: 0,
      learningCoverage: [],
      notice:
        "Penyimpanan belajar belum tersedia. Coba lagi setelah pengelola menyelesaikan pengaturan.",
    });
  }
}
