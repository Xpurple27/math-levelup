import "server-only";
import { isQuestionAllowed } from "./content-qa";
import { randomInt } from "node:crypto";
import { additionalBank } from "./additional-content";
import { topics } from "./topics";
export { topics } from "./topics";
export type Difficulty = "Basic" | "Medium" | "Hard";
export type Question = {
  id: string;
  version: number;
  topic: string;
  section: string;
  difficulty: Difficulty;
  stem: string;
  options: string[];
  correct: number;
  explanation: {
    understanding: string;
    firstStep: string;
    solution: string;
    mistake: string;
  };
  hint: string;
};
const originalBank: Question[] = topics.slice(0, 3).flatMap((t, ti) =>
  Array.from({ length: 36 }, (_, i) => {
    const difficulty: Difficulty =
      i < 12 ? "Basic" : i < 24 ? "Medium" : "Hard";
    const n = (i % 12) + 2;
    let stem = "",
      answer = 0,
      firstStep = "",
      solution = "",
      hint = "";
    if (t.id === "rasio") {
      const a = 2 + (n % 3),
        b = a + 2,
        k = n + 3;
      if (difficulty === "Basic") {
        stem = `Perbandingan pensil Rani dan Bima ${a} : ${b}. Total pensil mereka ${(a + b) * k}. Berapa pensil Rani?`;
        answer = a * k;
        firstStep = `Misalkan jumlah pensil Rani ${a}k dan Bima ${b}k.`;
        solution = `(${a} + ${b})k = ${(a + b) * k}, jadi k = ${k}. Rani memiliki ${a} × ${k} = ${answer} pensil.`;
        hint = "Jumlahkan bagian rasio, lalu bagi total dengan jumlah bagian.";
      } else if (difficulty === "Medium") {
        stem = `Perbandingan uang Rani dan Bima ${a} : ${b}. Selisih uang mereka ${(b - a) * k} ribu rupiah. Berapa uang Rani (dalam ribu rupiah)?`;
        answer = a * k;
        firstStep = `Selisih bagian rasio adalah ${b} − ${a}.`;
        solution = `(${b} − ${a})k = ${(b - a) * k}, jadi k = ${k}. Uang Rani ${a} × ${k} = ${answer} ribu rupiah.`;
        hint = "Gunakan selisih bagian rasio, bukan jumlah bagian.";
      } else {
        const add = 2 * k;
        stem = `Rasio siswa putra dan putri suatu klub ${a} : ${b}. Setelah ${add} siswa putra bergabung, jumlah putra sama dengan putri. Berapa jumlah anggota klub sebelum penambahan?`;
        answer = (a + b) * k;
        firstStep = `Tuliskan putra ${a}k dan putri ${b}k. Penambahan hanya pada putra.`;
        solution = `${a}k + ${add} = ${b}k. Jadi 2k = ${add} dan k = ${k}. Jumlah awal = (${a}+${b}) × ${k} = ${answer}.`;
        hint = "Samakan jumlah putra setelah penambahan dengan jumlah putri.";
      }
    } else if (t.id === "aljabar") {
      const a = 2 + (n % 4),
        b = n + 4,
        x = n + 2;
      if (difficulty === "Basic") {
        stem = `Jika ${a}x + ${b} = ${a * x + b}, berapakah x?`;
        answer = x;
        firstStep = `Kurangi kedua ruas dengan ${b}.`;
        solution = `${a}x = ${a * x + b} − ${b} = ${a * x}. Maka x = ${a * x} ÷ ${a} = ${x}.`;
        hint = "Hilangkan konstanta terlebih dahulu.";
      } else if (difficulty === "Medium") {
        stem = `Biaya sewa sepeda ${b} ribu rupiah ditambah ${a} ribu rupiah per jam. Total biaya ${a * x + b} ribu rupiah. Berapa jam sepeda disewa?`;
        answer = x;
        firstStep = "Misalkan x adalah lama sewa dalam jam.";
        solution = `${a}x + ${b} = ${a * x + b}. Maka ${a}x = ${a * x} dan x = ${x} jam.`;
        hint = "Kurangi biaya tetap dari total biaya.";
      } else {
        stem = `Dua paket internet berbiaya A = ${a}x + ${b} dan B = ${a + 2}x − ${2 * x - b} (ribu rupiah), dengan x banyak GB. Pada pemakaian berapa GB kedua biaya sama?`;
        answer = x;
        firstStep = "Samakan kedua rumus biaya, kemudian kumpulkan suku x.";
        solution = `${a}x + ${b} = ${a + 2}x − ${2 * x - b}. Maka 2x = ${2 * x} sehingga x = ${x} GB.`;
        hint =
          "Pindahkan suku variabel ke satu ruas dan konstanta ke ruas lain.";
      }
    } else {
      const avg = 60 + n,
        count = 4;
      if (difficulty === "Basic") {
        stem = `Nilai empat siswa adalah ${avg - 6}, ${avg - 2}, ${avg + 2}, dan ${avg + 6}. Berapa rata-ratanya?`;
        answer = avg;
        firstStep = "Jumlahkan empat nilai, lalu bagi empat.";
        solution = `Jumlah nilai = ${avg * 4}. Rata-rata = ${avg * 4} ÷ 4 = ${avg}.`;
        hint = "Rata-rata memakai semua nilai, bukan hanya nilai tengah.";
      } else if (difficulty === "Medium") {
        stem = `Rata-rata ${count} siswa adalah ${avg}. Seorang siswa dengan nilai ${avg + 10} bergabung. Berapa rata-rata kelima siswa?`;
        answer = avg + 2;
        firstStep = `Jumlah nilai awal = ${count} × ${avg}.`;
        solution = `Jumlah baru = ${count * avg} + ${avg + 10} = ${5 * avg + 10}. Rata-rata baru = ${5 * avg + 10} ÷ 5 = ${answer}.`;
        hint =
          "Cari jumlah nilai awal, tambahkan nilai baru, lalu bagi jumlah siswa baru.";
      } else {
        stem = `Kelompok A berisi 3 siswa dengan rata-rata ${avg}. Kelompok B berisi 2 siswa. Rata-rata gabungan 5 siswa adalah ${avg + 4}. Berapa rata-rata kelompok B?`;
        answer = avg + 10;
        firstStep =
          "Cari jumlah nilai gabungan dan kurangi jumlah nilai kelompok A.";
        solution = `Jumlah gabungan = 5 × ${avg + 4} = ${5 * (avg + 4)}. Jumlah A = 3 × ${avg} = ${3 * avg}. Jumlah B = ${2 * (avg + 10)}. Rata-rata B = ${2 * (avg + 10)} ÷ 2 = ${answer}.`;
        hint =
          "Rata-rata gabungan harus diberi bobot berdasarkan banyak anggota.";
      }
    }
    const correct = (i + ti) % 4;
    const options = [answer - 3, answer + 2, answer + 5, answer + 8].map(
      String,
    );
    options[correct] = String(answer);
    return {
      id: `${t.id}-${i + 1}`,
      version: 1,
      topic: t.id,
      section: t.section,
      difficulty,
      stem,
      options,
      correct,
      explanation: {
        understanding:
          "Tentukan besaran yang ditanyakan dan hubungan informasi dalam soal.",
        firstStep,
        solution,
        mistake: t.mistake,
      },
      hint,
    };
  }),
);
export const bank: Question[] = [...originalBank, ...additionalBank];
export type SelectionOptions = {
  difficulty?: Difficulty | "Mixed";
  excludedIds?: string[];
  random?: (max: number) => number;
};
export function selectQuestions(
  kind: string,
  topic?: string,
  count = 5,
  options: SelectionOptions = {},
) {
  const random = options.random ?? randomInt,
    seen = new Set(options.excludedIds || []);
  function shuffle<T>(values: T[]): T[] {
    const out = [...values];
    for (let i = out.length - 1; i > 0; i--) {
      const j = random(i + 1);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
  function pick(
    topicId: string,
    difficulty: Difficulty | "Mixed",
    amount: number,
  ) {
    const pool = bank.filter(
      (q) =>
        isQuestionAllowed(q) &&
        q.topic === topicId &&
        (difficulty === "Mixed" || q.difficulty === difficulty),
    );
    if (pool.length < amount)
      throw new Error(
        "Jumlah soal melebihi bank pada tingkat kesulitan ini. Pilih jumlah lebih kecil.",
      );
    const fresh = shuffle(pool.filter((q) => !seen.has(q.id))),
      review = shuffle(pool.filter((q) => seen.has(q.id)));
    return [...fresh, ...review].slice(0, amount);
  }
  if (kind === "diagnostic") {
    // 15 items, exactly five per section, covering all seven available subtopics.
    const quotas: Record<string, Difficulty[]> = {
      rasio: ["Basic", "Medium"],
      aljabar: ["Basic", "Medium", "Hard"],
      statistika: ["Basic", "Medium", "Hard"],
      persen: ["Medium"],
      geometri: ["Basic", "Hard"],
      peluang: ["Basic", "Medium"],
      pola: ["Medium", "Hard"],
    };
    return shuffle(
      topics.flatMap((t) => quotas[t.id].flatMap((d) => pick(t.id, d, 1))),
    );
  }
  const topicId = topic || "rasio";
  if (kind === "guided")
    return (["Basic", "Medium", "Hard"] as const).flatMap((d) =>
      pick(topicId, d, 2),
    );
  if (kind === "mini")
    return shuffle([
      ...pick(topicId, "Medium", 3),
      ...pick(topicId, "Hard", 2),
    ]);
  const difficulty = options.difficulty || "Mixed";
  if (difficulty !== "Mixed") return shuffle(pick(topicId, difficulty, count));
  // Mixed sessions include every level, not an accidentally Basic-only random draw.
  const basic = Math.floor(count / 3),
    medium = Math.floor(count / 3),
    hard = count - basic - medium;
  return shuffle([
    ...pick(topicId, "Basic", basic),
    ...pick(topicId, "Medium", medium),
    ...pick(topicId, "Hard", hard),
  ]);
}
export function publicQuestion(q: Question) {
  return {
    id: q.id,
    version: q.version,
    topic: q.topic,
    section: q.section,
    difficulty: q.difficulty,
    stem: q.stem,
    options: q.options,
  };
}
