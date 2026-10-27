import "server-only";

import { publicMastery } from "@/lib/scoring";
import * as store from "@/lib/store";
import { listPracticePackages } from "../practice/packages";
import { publishedQuestions } from "../content/runtime";
import { selectionReadiness } from "@/lib/content-readiness";
import { publishedLearningCoverage } from "../learning/catalog";
import { response } from "../http";

export async function progressResponse(user: store.User) {
  try {
    const [progress, available] = await Promise.all([
      store.progress(user.id),
      Promise.all([
        publishedLearningCoverage(),
        listPracticePackages(),
        publishedQuestions(),
      ])
        .then(([learning, practice, bank]) => {
          const readiness = selectionReadiness(bank);
          const practiceCoverage = [
            ...new Set(
              practice
                .filter((p) => p.access === "FREE")
                .flatMap((p) => p.subtopicIds || []),
            ),
          ];
          return {
            ...readiness,
            practiceCoverage,
            learningCoverage: learning.filter(
              (id) =>
                practiceCoverage.includes(id) &&
                readiness.miniCoverage.includes(id),
            ),
          };
        })
        .catch(() => ({
          learningCoverage: [],
          practiceCoverage: [],
          miniCoverage: [],
          diagnosticReady: false,
          notice:
            "Arah belajar belum dapat diperiksa. Riwayatmu tetap tersedia; coba muat ulang.",
        })),
    ]);
    return response({
      user,
      ...progress,
      mastery: progress.mastery.map(publicMastery),
      ...available,
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
