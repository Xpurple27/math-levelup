import { expect, test, type Page } from "@playwright/test";

async function post(page: Page, data: Record<string, unknown>) {
  return page.evaluate(async (body) => {
    const r = await fetch("/api/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { status: r.status, data: await r.json() };
  }, data);
}
async function answer(page: Page, index: number, choice = "B") {
  await page
    .getByRole("button", { name: `Buka soal ${index + 1}`, exact: true })
    .click();
  await page
    .getByRole("button", { name: new RegExp(`Pilihan ${choice}:`) })
    .click();
  await expect(
    page.getByText("Tersimpan di server", { exact: true }),
  ).toBeVisible();
}
async function submit(page: Page) {
  await page
    .getByRole("button", { name: "Selesaikan sesi", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Kirim jawaban", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Pembahasan lengkap" }),
  ).toBeVisible();
}
async function nav(page: Page, label: string) {
  await page
    .locator("button:visible")
    .filter({ hasText: new RegExp(`^${label}$`) })
    .first()
    .click();
}
async function capture(page: Page, path: string) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      document
        .getAnimations()
        .filter(
          (animation) => animation.effect?.getTiming().iterations !== Infinity,
        )
        .map((animation) => animation.finished.catch(() => undefined)),
    );
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur();
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await page.screenshot({ path, fullPage: true, animations: "disabled" });
}
async function fits(page: Page, width: number) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(width);
  await expect(page.locator(".katex-error")).toHaveCount(0);
}

for (const width of [1280, 390])
  test(`verified learning loop persists across login (${width}px, TEST_ONLY)`, async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 844 });
    await page.setExtraHTTPHeaders({
      "x-forwarded-for": width === 390 ? "192.0.2.101" : "192.0.2.102",
    });
    const email = `loop-${width}-${Date.now()}@example.com`;
    await page.goto("/register");
    await page.getByLabel("Nama lengkap").fill("TEST_ONLY Siswa");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Kata sandi").fill("Test-only-2026");
    await page.getByRole("button", { name: "Buat akun", exact: true }).click();
    await expect(page).toHaveURL(/\/app$/);
    await page.getByRole("button", { name: /^Start Diagnostic/ }).click();
    await answer(page, 0, "A");
    const id = await page.evaluate(() =>
      localStorage.getItem("levelup-attempt"),
    );
    const before = await page.evaluate(
      async (id) =>
        (await (await fetch(`/api/action?attempt=${id}`)).json()).attempt,
      id,
    );
    await page.reload();
    await expect(page.getByRole("button", { name: /Pilihan A:/ })).toHaveClass(
      /chosen/,
    );
    await page
      .getByRole("button", { name: "Simpan & kembali", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Keluar dari akun", exact: true })
      .click();
    await expect(page).toHaveURL(/signed_out=1/);
    await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Kata sandi").fill("Test-only-2026");
    await page.getByRole("button", { name: "Masuk", exact: true }).click();
    await expect(page).toHaveURL(/\/app$/);
    await page.getByRole("button", { name: /^Start Diagnostic/ }).click();
    await expect(page.getByRole("button", { name: /Pilihan A:/ })).toHaveClass(
      /chosen/,
    );
    const resumed = await page.evaluate(
      async (id) =>
        (await (await fetch(`/api/action?attempt=${id}`)).json()).attempt,
      id,
    );
    expect(resumed.id).toBe(before.id);
    expect(resumed.deadline).toBe(before.deadline);
    for (let i = 0; i < 15; i++) await answer(page, i, "A");
    await submit(page);
    await fits(page, width);
    await nav(page, "Home");
    await expect(
      page.getByText(/Indikator mastery .* soal unik/),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Buka rekomendasi belajar", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "TEST_ONLY Pelajari persamaan" }),
    ).toBeVisible();
    await expect(
      page.getByText("TEST_ONLY EMPTY", { exact: true }),
    ).toHaveCount(0);
    await fits(page, width);
    if (process.env.VECTRA_CAPTURE_EVIDENCE)
      await capture(page, `docs/evidence/test-only-${width}-learning.png`);
    await page.getByRole("button", { name: /Continue to Practice/ }).click();
    await expect(
      page.getByRole("heading", { name: "TEST_ONLY Latihan terarah" }),
    ).toBeVisible();
    await page.getByRole("button", { name: /Start Practice/ }).click();
    for (let i = 0; i < 5; i++) await answer(page, i);
    await submit(page);
    await page
      .getByRole("button", { name: /Asesmen ulang keterampilan/ })
      .click();
    for (let i = 0; i < 5; i++) await answer(page, i);
    await submit(page);
    await expect(page.getByText(/0 dari 5 soal pernah muncul/)).toBeVisible();
    await fits(page, width);
    await page
      .getByRole("button", { name: "Lihat progres", exact: true })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "Bukti per keterampilan",
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.locator(".history-row")).toHaveCount(3);
    if (process.env.VECTRA_CAPTURE_EVIDENCE)
      await capture(page, `docs/evidence/test-only-${width}-progress.png`);
    await page
      .getByRole("button", { name: "Keluar dari akun", exact: true })
      .click();
    await expect(page).toHaveURL(/signed_out=1/);
    await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Kata sandi").fill("Test-only-2026");
    await page.getByRole("button", { name: "Masuk", exact: true }).click();
    await expect(page).toHaveURL(/\/app$/);
    await nav(page, "Progress");
    await expect(page.locator(".history-row")).toHaveCount(3);
    await page
      .locator(".history-row")
      .filter({ hasText: "Checkpoint" })
      .click();
    await expect(
      page.getByRole("heading", { name: "Bukti asesmen ulang" }),
    ).toBeVisible();
    await fits(page, width);
  });

test("blank submissions add no mastery and catalog duration defeats client overrides", async ({
  page,
}) => {
  await page.goto("/login");
  const registered = await post(page, {
    action: "register",
    email: `blank-${Date.now()}@example.com`,
    name: "TEST_ONLY Blank",
    password: "Test-only-2026",
  });
  expect(registered.status).toBe(200);
  const a = (await post(page, { action: "start", kind: "diagnostic" })).data
    .attempt;
  const done = (await post(page, { action: "submit", id: a.id })).data.attempt;
  expect(done.result.unanswered).toBe(15);
  const progress = await page.evaluate(async () =>
    (await fetch("/api/action")).json(),
  );
  expect(progress.mastery).toEqual([]);
  expect(progress.learningCoverage).toEqual([
    "14000000-0000-4000-8000-000000000001",
  ]);
  const timed = (
    await post(page, {
      action: "start",
      kind: "tryout",
      packageSlug: "test-tryout-1",
      durationSeconds: 999999,
    })
  ).data.attempt;
  expect(timed.deadline - timed.started).toBe(90_000);
  expect(timed.questions).toHaveLength(5);
  expect(
    timed.questions.every(
      (q: Record<string, unknown>) =>
        q.correct === undefined && q.explanation === undefined,
    ),
  ).toBe(true);
  // Exhaust the finite TEST_ONLY pool. Later reassessments must disclose reuse.
  let reused = 0;
  for (let round = 0; round < 4; round++) {
    const mini = (
      await post(page, {
        action: "start",
        kind: "mini",
        topic: "14000000-0000-4000-8000-000000000001",
      })
    ).data.attempt;
    for (const q of mini.questions) {
      await post(page, {
        action: "answer",
        id: mini.id,
        questionId: q.id,
        selected: 1,
      });
    }
    const result = (await post(page, { action: "submit", id: mini.id })).data
      .attempt;
    reused = result.reusedQuestionCount;
  }
  expect(reused).toBe(5);
});

test("three-section suite completes and browser summary belongs to its account", async ({
  page,
}) => {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": "192.0.2.103" });
  await page.goto("/login");
  await post(page, {
    action: "register",
    email: `suite-${Date.now()}@example.com`,
    name: "TEST_ONLY Suite",
    password: "Test-only-2026",
  });
  await page.goto("/app");
  await nav(page, "Assessment");
  await page.getByRole("button", { name: /Mulai Mini Tryout/ }).click();
  for (let section = 0; section < 3; section++) {
    for (let i = 0; i < 5; i++) await answer(page, i);
    await page
      .getByRole("button", { name: "Selesaikan sesi", exact: true })
      .first()
      .click();
    await page
      .getByRole("button", { name: "Kirim jawaban", exact: true })
      .click();
    if (section < 2)
      await page
        .getByRole("button", {
          name: section === 0 ? /^Lanjut PM/ : /^Lanjut PU/,
        })
        .click();
  }
  await expect(
    page.getByRole("dialog", { name: "Hasil Mini Tryout" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Lihat analisis & pembahasan", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Hasil Mini Tryout" }),
  ).toHaveCount(0);
  const keys = await page.evaluate(() =>
    Object.keys(localStorage).filter((key) =>
      key.startsWith("vectra-mini-tryout-stats"),
    ),
  );
  expect(keys).toHaveLength(1);
  expect(keys[0]).toMatch(/^vectra-mini-tryout-stats:[a-f0-9-]+$/);
  await page
    .getByRole("button", { name: "Keluar dari akun", exact: true })
    .click();
  await expect(page).toHaveURL(/signed_out=1/);
  await page.goto("/login");
  await post(page, {
    action: "register",
    email: `suite-other-${Date.now()}@example.com`,
    name: "TEST_ONLY Other",
    password: "Test-only-2026",
  });
  await page.goto("/app");
  await nav(page, "Assessment");
  await expect(page.getByText(/Sudah 1 percobaan/)).toHaveCount(0);
});
