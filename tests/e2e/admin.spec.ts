import { test, expect, type Page } from "@playwright/test";
import ExcelJS from "exceljs";

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Kata sandi").fill("Test-only-2026");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  if (email.startsWith("admin")) await expect(page).toHaveURL(/\/admin$/);
  else if (email.startsWith("reviewer"))
    await expect(page).toHaveURL(/\/reviewer$/);
  else await expect(page).toHaveURL(/\/app$/);
}

test("admin draft preview, independent QA, explicit publication and Excel drafts", async ({
  browser,
}) => {
  const ac = await browser.newContext();
  const rc = await browser.newContext();
  const a = await ac.newPage();
  const r = await rc.newPage();

  await login(a, "admin@example.com");
  await login(r, "reviewer@example.com");

  await a.goto("/admin/questions/new");
  await a.getByLabel("Kode soal", { exact: true }).fill("E2E-EDITOR");
  await a
    .getByLabel("Pertanyaan utama wajib", { exact: true })
    .fill("TEST_ONLY $x+1=3$");
  for (const [k, v] of [
    ["A", "1"],
    ["B", "2"],
    ["C", "3"],
    ["D", "4"],
  ])
    await a.getByLabel("Option " + k, { exact: true }).fill(v);
  await a.getByLabel("Correct B", { exact: true }).check();

  for (const [label, value] of [
    ["Apa yang sebenarnya ditanyakan? wajib", "TEST_ONLY memahami persamaan"],
    ["Konsep yang digunakan wajib", "TEST_ONLY operasi aljabar"],
    ["Langkah pertama wajib", "TEST_ONLY kurangi 1"],
    ["Penyelesaian lengkap wajib", "TEST_ONLY $x=2$"],
    ["Jawaban akhir wajib", "TEST_ONLY 2"],
  ])
    await a.getByLabel(label, { exact: true }).fill(value);

  await expect(a.locator("#preview .katex").first()).toBeVisible();
  await a.getByRole("button", { name: "Simpan draft", exact: true }).click();
  await expect(a).toHaveURL(/\/admin\/questions\/[a-f0-9-]+$/);
  await a.getByRole("button", { name: "Kirim ke QA", exact: true }).click();
  await expect(a.getByText(/Versi 1 · IN_REVIEW/).first()).toBeVisible();

  await r.goto("/reviewer/queue");
  for (const name of [
    "Kebenaran matematika",
    "Kunci jawaban",
    "Kejelasan bahasa",
    "Tingkat kesulitan",
    "Klasifikasi / taxonomy",
    "Kualitas pembahasan",
    "Kualitas pengecoh",
  ])
    await r.getByText(name, { exact: true }).click();
  await r
    .getByLabel("Catatan reviewer")
    .fill("TEST_ONLY independently verified");
  await r.getByRole("button", { name: "Approve QA", exact: true }).click();

  await a.reload();
  await a.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(a.getByText(/Versi 1 · PUBLISHED/).first()).toBeVisible();
  await a
    .getByRole("button", { name: "Buat revisi baru", exact: true })
    .click();
  await expect(a.getByText(/Versi 2 · DRAFT/).first()).toBeVisible();

  const w = new ExcelJS.Workbook();
  await w.xlsx.readFile("public/templates/levelup-question-import.xlsx");
  const s = w.getWorksheet("Questions")!;
  s.getRow(2).getCell(1).value = "";
  s.getRow(2).getCell(2).value = "E2E-IMPORT";
  const bytes = Buffer.from(await w.xlsx.writeBuffer());

  await a.goto("/admin/imports");
  await a.locator('input[name="file"]').setInputFiles({
    name: "test.xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: bytes,
  });
  await a.getByRole("button", { name: "Upload & Preview" }).click();
  await expect(
    a.getByRole("heading", { name: "test.xlsx", exact: true }),
  ).toBeVisible();
  await expect(a.getByText(/READY_FOR_REVIEW/).first()).toBeVisible();
  a.once("dialog", (d) => d.accept());
  await a.getByRole("button", { name: "Import valid rows as DRAFT" }).click();
  await expect(a.getByText(/IMPORTED/).first()).toBeVisible();

  await a.goto("/admin/questions");
  await a.getByLabel("Cari soal").fill("E2E-IMPORT");
  await expect(
    a
      .getByRole("row")
      .filter({ has: a.getByRole("cell", { name: "E2E-IMPORT", exact: true }) })
      .getByRole("cell", { name: "DRAFT", exact: true }),
  ).toBeVisible();

  s.getRow(2).getCell(2).value = "E2E-INVALID";
  s.getRow(2).getCell(17).value = "A,B";
  await a.goto("/admin/imports");
  await a.locator('input[name="file"]').setInputFiles({
    name: "invalid.xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: Buffer.from(await w.xlsx.writeBuffer()),
  });
  await a.getByRole("button", { name: "Upload & Preview" }).click();
  await expect(
    a.getByRole("heading", { name: "invalid.xlsx", exact: true }),
  ).toBeVisible();
  await expect(a.getByText(/VALIDATION_FAILED/).first()).toBeVisible();
  await expect(
    a.getByRole("button", { name: "Import valid rows as DRAFT" }),
  ).toBeDisabled();

  const denied = await r.evaluate(
    async () =>
      (
        await fetch("/api/admin/content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "archive",
            payload: { id: "00000000-0000-4000-8000-000000000099" },
          }),
        })
      ).status,
  );
  expect(denied).toBe(403);
  await ac.close();
  await rc.close();
});
