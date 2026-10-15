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

test("mobile landing keeps login and registration visible and tappable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const login = page.getByRole("link", { name: "Masuk", exact: true }).first();
  const register = page.getByRole("link", { name: "Daftar gratis", exact: true }).first();
  await expect(login).toBeVisible();
  await expect(register).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await login.click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/");
  await page.getByRole("link", { name: "Daftar gratis", exact: true }).first().click();
  await expect(page).toHaveURL(/\/register$/);
});

test("mobile login stays readable without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");

  await expect(
    page.getByRole("heading", { name: "Selamat datang kembali." }),
  ).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Kata sandi")).toBeVisible();
  await expect(page.getByRole("button", { name: "Masuk" })).toBeVisible();

  const emailFontSize = await page.getByLabel("Email").evaluate((el) =>
    Number.parseFloat(getComputedStyle(el).fontSize),
  );
  expect(emailFontSize).toBeGreaterThanOrEqual(16);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("public diagnostic preview is an actionable registration link", async ({ page }) => {
  await page.goto("/");
  const previewCta = page.getByRole("link", { name: "Mulai diagnostik" });
  await expect(previewCta).toBeVisible();
  await previewCta.click();
  await expect(page).toHaveURL(/\/register$/);
});
