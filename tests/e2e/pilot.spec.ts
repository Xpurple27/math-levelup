import { test, expect } from "@playwright/test";
import questions from "../../content/pilot-questions.json";
import manifest from "../../content/pilot-manifest.json";
test("full bounded pilot flow with mixed results, guided retry, persistence and page feedback", async ({
  page,
}) => {
  test.skip(
    process.env.NEXT_PUBLIC_LEVELUP_PILOT_MODE !== "1",
    "Run separately with the documented pilot build.",
  );
  test.setTimeout(90000);
  const email = `pilot-flow-${Date.now()}@example.com`,
    password = "fixture-pilot-flow-password";
  const post = (data: Record<string, unknown>) =>
    page.evaluate(async (body) => {
      const r = await fetch("/api/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return { status: r.status, data: await r.json() };
    }, data);
  const progress = () =>
    page.evaluate(async () => await (await fetch("/api/action")).json());
  const start = async (button: string) => {
    const pending = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/action") &&
        r.request().method() === "POST" &&
        r.request().postDataJSON().action === "start",
    );
    await page.getByRole("button", { name: button, exact: true }).click();
    return (await (await pending).json()).attempt;
  };
  const finish = async () => {
    await page
      .getByRole("button", { name: "Selesaikan sesi", exact: true })
      .first()
      .click();
    await page
      .getByRole("button", { name: "Kirim jawaban", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Lanjut belajar", exact: true }),
    ).toBeVisible();
  };
  await page.goto("/");
  await expect(
    page.getByText("Belum diukur", { exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Mulai diagnostik gratis" }).click();
  await page.getByLabel("Nama lengkap").fill("Pilot Flow");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Kata sandi").fill(password);
  await page.getByRole("button", { name: "Buat akun", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Halo, Pilot" }),
  ).toBeVisible();
  const diagnostic = await start("Mulai diagnostik gratis");
  expect(diagnostic.questions.map((q: { id: string }) => q.id)).toEqual(
    manifest.diagnostic,
  );
  for (let i = 0; i < 15; i++) {
    const q = diagnostic.questions[i],
      key = questions.find((item) => item.id === q.id)!.correct,
      index = q.topic === "rasio" ? (key + 1) % 4 : key;
    await page
      .getByRole("button", { name: `Buka soal ${i + 1}`, exact: true })
      .click();
    await page
      .getByRole("button", {
        name: new RegExp(`Pilihan ${String.fromCharCode(65 + index)}:`),
      })
      .click();
    await expect(
      page.getByText("Tersimpan di server", { exact: true }),
    ).toBeVisible();
  }
  await finish();
  await expect(
    page.getByText("Perlu diperkuat", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Kekuatan awal", { exact: true }).first(),
  ).toBeVisible();
  const before = await progress();
  expect(
    before.mastery.find((m: { topic: string }) => m.topic === "rasio").value,
  ).toBe(0);
  await page
    .getByRole("button", { name: "Lanjut belajar", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Cara Mengenali Soal" }),
  ).toBeVisible();
  await page.getByLabel("Cari materi").fill("statistika");
  await expect(
    page.getByText("Materi belum ditemukan. Coba kata kunci lain."),
  ).toBeVisible();
  await page.getByLabel("Cari materi").fill("");
  const guided = await start("Latihan terbimbing");
  expect(guided.questions.map((q: { id: string }) => q.id)).toEqual(
    manifest.learning.rasio.guided,
  );
  for (let i = 0; i < 6; i++) {
    const q = guided.questions[i],
      key = questions.find((item) => item.id === q.id)!.correct;
    if (i === 0) {
      await page
        .getByRole("button", {
          name: new RegExp(
            `Pilihan ${String.fromCharCode(65 + ((key + 1) % 4))}:`,
          ),
        })
        .click();
      await expect(
        page.getByText("Belum tepat. Coba sekali lagi.", { exact: true }),
      ).toBeVisible();
    }
    await page
      .getByRole("button", {
        name: new RegExp(`Pilihan ${String.fromCharCode(65 + key)}:`),
      })
      .click();
    await expect(page.getByText("Penyelesaian", { exact: true })).toBeVisible();
    if (i < 5)
      await page
        .getByRole("button", { name: "Berikutnya", exact: true })
        .click();
  }
  await finish();
  await page
    .getByRole("button", { name: "Lanjut belajar", exact: true })
    .click();
  const mini = await start("Uji pemahaman");
  for (let i = 0; i < 5; i++) {
    const q = mini.questions[i],
      key = questions.find((item) => item.id === q.id)!.correct;
    await page
      .getByRole("button", {
        name: new RegExp(`Pilihan ${String.fromCharCode(65 + key)}:`),
      })
      .click();
    await expect(
      page.getByText("Tersimpan di server", { exact: true }),
    ).toBeVisible();
    if (i < 4)
      await page
        .getByRole("button", { name: "Berikutnya", exact: true })
        .click();
  }
  await finish();
  const after = await progress();
  expect(
    after.mastery.find((m: { topic: string }) => m.topic === "rasio").value,
  ).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Latihan", exact: true }).click();
  await page.getByLabel("Subtopik").selectOption("rasio");
  const practice = await start("Mulai latihan");
  for (let i = 0; i < 5; i++) {
    const key = questions.find(
      (item) => item.id === practice.questions[i].id,
    )!.correct;
    await page
      .getByRole("button", {
        name: new RegExp(`Pilihan ${String.fromCharCode(65 + key)}:`),
      })
      .click();
    await expect(page.getByText("Penyelesaian", { exact: true })).toBeVisible();
    if (i < 4)
      await page
        .getByRole("button", { name: "Berikutnya", exact: true })
        .click();
  }
  await finish();
  await page.getByRole("button", { name: "Progres", exact: true }).click();
  await page.getByRole("button", { name: "Kirim masukan halaman" }).click();
  await page.getByLabel("Jenis masalah").selectOption("display");
  await page
    .getByLabel("Detail masalah")
    .fill("Pilot flow fixture: progress context.");
  await page
    .getByRole("button", { name: "Kirim laporan", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Laporan tersimpan" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Tryout UTBK" }).click();
  await expect(
    page.getByRole("button", { name: "Detail PK — Paket 02" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Detail PK — Paket 01 Pilot RC" })
    .click();
  const attempt = await start("Mulai / lanjutkan paket");
  expect(attempt.deadline - attempt.started).toBe(1200000);
  await page.getByRole("button", { name: /Pilihan A:/ }).click();
  await expect(
    page.getByText("Tersimpan di server", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Laporkan masalah soal" }).click();
  await page
    .getByLabel("Detail masalah")
    .fill("Pilot question fixture report.");
  await page
    .getByRole("button", { name: "Kirim laporan", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Laporan tersimpan" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: /Pilihan A:/ })).toHaveClass(
    /chosen/,
  );
  await finish();
  for (const tab of ["Analisis", "Pembahasan", "Hasil"])
    await page.getByRole("tab", { name: tab, exact: true }).click();
  const persisted = await progress();
  expect(persisted.history.length).toBe(5);
  expect(
    (
      await post({
        action: "reportIssue",
        view: "progress",
        category: "suggestion",
        message: "Second page fixture",
        user_id: "forged-other",
      })
    ).status,
  ).toBe(200);
  await page.getByRole("button", { name: "Keluar", exact: true }).click();
  await page.getByRole("button", { name: "Mulai diagnostik gratis" }).click();
  await page.getByRole("button", { name: /Sudah punya akun/ }).click();
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Kata sandi").fill(password);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Masuk", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Halo, Pilot" }),
  ).toBeVisible();
  const restored = await progress();
  expect(restored.history).toEqual(persisted.history);
  expect(restored.mastery).toEqual(persisted.mastery);
});
