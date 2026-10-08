import { test, expect, type Page } from "@playwright/test";
import ExcelJS from "exceljs";
async function login(page: Page, email: string) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Masuk", exact: true })
    .first()
    .click();
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Kata sandi").fill("Test-only-2026");
  await page.getByRole("button", { name: "Masuk", exact: true }).last().click();
  await expect(page.getByRole("heading", { name: /Halo,/ })).toBeVisible();
}
test("admin draft preview, independent QA, explicit publication and Excel drafts", async ({
  browser,
}) => {
  const ac = await browser.newContext(),
    rc = await browser.newContext(),
    a = await ac.newPage(),
    r = await rc.newPage();
  await login(a, "admin@example.com");
  await login(r, "reviewer@example.com");
  await a.goto("/admin/questions/new");
  await a.getByLabel("Code", { exact: true }).fill("E2E-EDITOR");
  await a.getByLabel("stem_md", { exact: true }).fill("TEST_ONLY $x+1=3$");
  for (const [k, v] of [
    ["A", "1"],
    ["B", "2"],
    ["C", "3"],
    ["D", "4"],
  ])
    await a.getByLabel("Option " + k, { exact: true }).fill(v);
  await a.getByLabel("Correct B", { exact: true }).check();
  for (const label of [
    "Understanding *",
    "Konsep *",
    "Langkah Pertama *",
    "Penyelesaian *",
    "Jawaban Akhir *",
  ])
    await a.getByLabel(label, { exact: true }).fill("TEST_ONLY $x=2$");
  await expect(a.locator("#preview .katex").first()).toBeVisible();
  await a.getByRole("button", { name: "Save Draft", exact: true }).click();
  await expect(a).toHaveURL(/\/admin\/questions\/[a-f0-9-]+$/);
  await a.getByRole("button", { name: "Send to QA", exact: true }).click();
  await expect(a.getByText(/Version 1 · IN_REVIEW/).first()).toBeVisible();
  await r.goto("/admin/qa");
  for (const name of [
    "math",
    "key",
    "wording",
    "difficulty",
    "taxonomy",
    "explanation",
    "distractors",
  ])
    await r.getByLabel(name, { exact: true }).check();
  await r.getByLabel("Review notes").fill("TEST_ONLY independently verified");
  await r.getByRole("button", { name: "Approve", exact: true }).click();
  await a.reload();
  await a.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(a.getByText(/Version 1 · PUBLISHED/).first()).toBeVisible();
  await a.getByRole("button", { name: "Create Revision", exact: true }).click();
  await expect(a.getByText(/Version 2 · DRAFT/).first()).toBeVisible();
  const w = new ExcelJS.Workbook();
  await w.xlsx.readFile("public/templates/levelup-question-import.xlsx");
  const s = w.getWorksheet("Questions")!;
  s.getRow(2).getCell(1).value = "";
  s.getRow(2).getCell(2).value = "E2E-IMPORT";
  const bytes = Buffer.from(await w.xlsx.writeBuffer());
  await a.goto("/admin/imports");
  await a.getByLabel("Workbook .xlsx").setInputFiles({
    name: "test.xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: bytes,
  });
  await a.getByRole("button", { name: "Upload & Preview" }).click();
  await expect(
    a.getByRole("heading", {
      name: "test.xlsx · READY_FOR_REVIEW",
      exact: true,
    }),
  ).toBeVisible();
  a.once("dialog", (d) => d.accept());
  await a.getByRole("button", { name: "Confirm Import as DRAFT" }).click();
  await expect(
    a.getByRole("heading", { name: "test.xlsx · IMPORTED", exact: true }),
  ).toBeVisible();
  await a.goto("/admin/questions");
  await a.getByLabel("Search code / stem").fill("E2E-IMPORT");
  await expect(
    a
      .getByRole("row")
      .filter({ has: a.getByRole("cell", { name: "E2E-IMPORT", exact: true }) })
      .getByRole("cell", { name: "DRAFT", exact: true }),
  ).toBeVisible();
  s.getRow(2).getCell(2).value = "E2E-INVALID";
  s.getRow(2).getCell(17).value = "A,B";
  await a.goto("/admin/imports");
  await a.getByLabel("Workbook .xlsx").setInputFiles({
    name: "invalid.xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: Buffer.from(await w.xlsx.writeBuffer()),
  });
  await a.getByRole("button", { name: "Upload & Preview" }).click();
  await expect(
    a.getByRole("heading", {
      name: "invalid.xlsx · VALIDATION_FAILED",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    a.getByRole("button", { name: "Confirm Import as DRAFT" }),
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
