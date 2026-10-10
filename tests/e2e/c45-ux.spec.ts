import { expect, test } from "@playwright/test";

test("public site is separate from protected student app", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Tahu di mana kamu lemah/i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Masuk" }).first()).toBeVisible();

  await page.goto("/app");
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: "Selamat datang kembali." }),
  ).toBeVisible();
});

test("login and registration use dedicated pages", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Masuk" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Daftar gratis" })).toBeVisible();

  await page.goto("/register");
  await expect(
    page.getByRole("heading", { name: "Mulai perjalananmu." }),
  ).toBeVisible();
  await expect(page.getByLabel("Nama lengkap")).toBeVisible();
});
