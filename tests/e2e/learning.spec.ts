import { test, expect, type APIRequestContext } from "@playwright/test";
// API fixtures replay their own session cookie on loopback. Browser tests separately
// verify real Secure/HttpOnly production cookie behavior; no cookies are logged.
function localApi(raw: APIRequestContext) {
  async function headers(extra: Record<string, string> = {}) {
    const state = await raw.storageState();
    const cookie = state.cookies
      .filter((c) => c.name === "levelup_session")
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");
    return { ...extra, ...(cookie ? { cookie } : {}) };
  }
  return {
    async get(url: string) {
      return raw.get(url, { headers: await headers() });
    },
    async post(
      url: string,
      opts: { data: unknown; headers?: Record<string, string> },
    ) {
      return raw.post(url, { ...opts, headers: await headers(opts.headers) });
    },
  };
}
test("register → diagnostic with resume → result → learn → guided → mini → practice → progress", async ({
  page,
}) => {
  const email = `siswa-${Date.now()}@example.com`;
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Halo, Sobat LevelUP" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Mulai diagnostik gratis" }).click();
  await page.getByLabel("Nama lengkap").fill("Siswa Uji");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Kata sandi").fill("testing-math-2027");
  await page.getByRole("button", { name: "Buat akun", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Halo, Siswa" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Mulai diagnostik gratis" }).click();
  await expect(
    page.getByRole("heading", { name: "Satu soal, satu langkah." }),
  ).toBeVisible();
  const first = await page
    .getByRole("button", { name: /Pilihan A:/ })
    .textContent();
  await page.getByRole("button", { name: /Pilihan A:/ }).click();
  await expect(
    page.getByText("Tersimpan di server", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Satu soal, satu langkah." }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Pilihan A:/ })).toHaveClass(
    /chosen/,
  );
  expect(
    await page.getByRole("button", { name: /Pilihan A:/ }).textContent(),
  ).toContain(first!.replace("✓", ""));
  for (let i = 0; i < 15; i++) {
    await page
      .getByRole("button", { name: `Buka soal ${i + 1}`, exact: true })
      .click();
    await page.getByRole("button", { name: /Pilihan A:/ }).click();
    await expect(
      page.getByText("Tersimpan di server", { exact: true }),
    ).toBeVisible();
  }
  await page
    .getByRole("button", { name: "Selesaikan sesi", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Kirim jawaban" }).click();
  await expect(
    page.getByRole("heading", { name: "Profil kemampuan awalmu" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Lanjut belajar", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Cara Mengenali Soal" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Langkah Pertama", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Latihan terbimbing", exact: true })
    .click();
  for (let i = 0; i < 6; i++) {
    const choice = page.getByRole("button", { name: /Pilihan A:/ });
    await choice.click();
    await expect(
      page.getByText("Tersimpan di server", { exact: true }),
    ).toBeVisible();
    if (await page.getByText("Belum tepat. Coba sekali lagi.").isVisible())
      await page.getByRole("button", { name: /Pilihan B:/ }).click();
    await expect(page.getByText("Penyelesaian", { exact: true })).toBeVisible();
    if (i < 5)
      await page
        .getByRole("button", { name: "Berikutnya", exact: true })
        .click();
  }
  await page
    .getByRole("button", { name: "Selesaikan sesi", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Kirim jawaban" }).click();
  await expect(
    page.getByRole("heading", { name: "Satu langkah maju. Kerja bagus!" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Lanjut belajar", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Uji pemahaman", exact: true })
    .click();
  for (let i = 0; i < 5; i++) {
    await page.getByRole("button", { name: /Pilihan A:/ }).click();
    await expect(
      page.getByText("Tersimpan di server", { exact: true }),
    ).toBeVisible();
    if (i < 4)
      await page
        .getByRole("button", { name: "Berikutnya", exact: true })
        .click();
  }
  await page
    .getByRole("button", { name: "Selesaikan sesi", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Kirim jawaban" }).click();
  await expect(
    page.getByRole("heading", { name: "Satu langkah maju. Kerja bagus!" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Latihan", exact: true }).click();
  await page
    .getByRole("button", { name: "Mulai latihan", exact: true })
    .click();
  for (let i = 0; i < 5; i++) {
    await page.getByRole("button", { name: /Pilihan A:/ }).click();
    await expect(page.getByText("Penyelesaian", { exact: true })).toBeVisible();
    if (i < 4)
      await page
        .getByRole("button", { name: "Berikutnya", exact: true })
        .click();
  }
  await page
    .getByRole("button", { name: "Selesaikan sesi", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Kirim jawaban" }).click();
  await page
    .getByRole("button", { name: "Lihat progres", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Peta kemampuanmu" }),
  ).toBeVisible();
  await expect(
    page.getByText("Latihan mandiri", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/bukti soal · confidence/).first()).toBeVisible();
  await page.getByRole("button", { name: "Keluar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Halo, Sobat LevelUP" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Masuk", exact: true })
    .first()
    .click();
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Kata sandi").fill("testing-math-2027");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Masuk", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Halo, Siswa" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Progres", exact: true }).click();
  await expect(
    page.getByText("Latihan mandiri", { exact: true }),
  ).toBeVisible();
});
test("mobile home fits viewport and navigation opens", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Halo, Sobat LevelUP" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: "Buka menu" }).click();
  await page.getByRole("button", { name: "Belajar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Belajar dengan arah" }),
  ).toBeVisible();
});
test("assessment authority and ownership boundaries", async ({
  request: rawRequest,
  browser,
}) => {
  const request = localApi(rawRequest);
  const origin = "http://127.0.0.1:3000";
  const post = (data: unknown) =>
    request.post("/api/action", { data, headers: { origin } });
  expect((await post({ action: "start", kind: "diagnostic" })).status()).toBe(
    401,
  );
  expect(
    (
      await request.post("/api/action", {
        data: { action: "register" },
        headers: { origin: "https://evil.example" },
      })
    ).status(),
  ).toBe(403);
  await post({
    action: "register",
    email: `security-${Date.now()}@example.com`,
    name: "Security Test",
    password: "test-password-123",
  });
  const started = await (
    await post({ action: "start", kind: "diagnostic" })
  ).json();
  const a = started.attempt;
  expect(a.questions).toHaveLength(15);
  for (const q of a.questions) {
    expect(q.correct).toBeUndefined();
    expect(q.explanation).toBeUndefined();
    expect(q.hint).toBeUndefined();
  }
  const deadline = a.deadline;
  await post({
    action: "answer",
    id: a.id,
    questionId: a.questions[0].id,
    selected: 1,
    deadline: Date.now() + 99999999,
    score: 100,
  });
  expect(
    (
      await post({
        action: "answer",
        id: a.id,
        questionId: a.questions[1].id,
        selected: 7,
      })
    ).status(),
  ).toBe(400);
  const outsider = await browser.newContext();
  const outsiderApi = localApi(outsider.request);
  expect(
    (await outsiderApi.get(`${origin}/api/action?attempt=${a.id}`)).status(),
  ).toBe(200);
  expect(
    (
      await (
        await outsiderApi.get(`${origin}/api/action?attempt=${a.id}`)
      ).json()
    ).attempt,
  ).toBeUndefined();
  await outsiderApi.post(`${origin}/api/action`, {
    headers: { origin },
    data: {
      action: "register",
      email: `outsider-${Date.now()}@example.com`,
      name: "Other Student",
      password: "test-password-123",
    },
  });
  expect(
    (await outsiderApi.get(`${origin}/api/action?attempt=${a.id}`)).status(),
  ).toBe(404);
  expect(
    (
      await outsiderApi.post(`${origin}/api/action`, {
        headers: { origin },
        data: { action: "submit", id: a.id },
      })
    ).status(),
  ).toBe(404);
  await outsider.close();
  const first = await (
    await post({ action: "submit", id: a.id, score: 100 })
  ).json();
  expect(first.attempt.result.unanswered).toBe(14);
  expect(first.attempt.deadline).toBe(deadline);
  expect(first.attempt.result.score).toBeLessThan(100);
  const repeated = await (await post({ action: "submit", id: a.id })).json();
  expect(repeated.attempt.result).toEqual(first.attempt.result);
  const changed = await (
    await post({
      action: "answer",
      id: a.id,
      questionId: a.questions[0].id,
      selected: 3,
    })
  ).json();
  expect(changed.attempt.answers[a.questions[0].id]).toBe(1);
});

test("expired diagnostic rejects late answers and finalizes once", async ({
  request: rawRequest,
}) => {
  const request = localApi(rawRequest);
  const post = (data: unknown) =>
    request.post("/api/action", {
      data,
      headers: { origin: "http://127.0.0.1:3000" },
    });
  await post({
    action: "register",
    email: `expiry-${Date.now()}@example.com`,
    name: "Expiry Test",
    password: "test-password-123",
  });
  const { attempt: a } = await (
    await post({ action: "start", kind: "diagnostic" })
  ).json();
  await post({
    action: "answer",
    id: a.id,
    questionId: a.questions[0].id,
    selected: 0,
  });
  const resumed = await (
    await post({ action: "start", kind: "diagnostic" })
  ).json();
  expect(resumed.attempt.id).toBe(a.id);
  expect(resumed.attempt.deadline).toBe(a.deadline);
  // Change only this newly created fixture's deadline; never delete or reset student data.
  const { DatabaseSync } = await import("node:sqlite");
  const { resolve } = await import("node:path");
  const db = new DatabaseSync(
    resolve(process.env.LEVELUP_DATA_DIR || ".data", "levelup.sqlite"),
  );
  db.prepare("UPDATE attempts SET deadline=? WHERE id=?").run(
    Date.now() - 1000,
    a.id,
  );
  db.close();
  const expired = await (
    await post({
      action: "answer",
      id: a.id,
      questionId: a.questions[1].id,
      selected: 1,
    })
  ).json();
  expect(expired.attempt.status).toBe("completed");
  expect(expired.attempt.answers[a.questions[1].id]).toBeUndefined();
  expect(expired.attempt.result.unanswered).toBe(14);
  const before = await (await request.get("/api/action")).json();
  await post({ action: "submit", id: a.id });
  const after = await (await request.get("/api/action")).json();
  expect(after.mastery).toEqual(before.mastery);
  expect(after.history).toHaveLength(1);
});
