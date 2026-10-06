import "server-only";
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
export const bank: Question[] = topics.flatMap((t, ti) =>
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
export function selectQuestions(kind: string, topic?: string, count = 5) {
  if (kind === "diagnostic")
    return topics.flatMap((t) =>
      [0, 3, 13, 17, 26].map((i) => bank.filter((q) => q.topic === t.id)[i]),
    );
  const pool = bank.filter((q) => q.topic === (topic || "rasio"));
  if (kind === "guided") return [1, 5, 14, 19, 25, 28].map((i) => pool[i]);
  if (kind === "mini") return [15, 18, 21, 29, 32].map((i) => pool[i]);
  return Array.from({ length: count }, (_, i) => pool[(i * 7 + 2) % 36]);
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
