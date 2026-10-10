import { test, expect, type APIRequestContext } from "@playwright/test";

test("register, diagnostic autosave/resume, result and empty learning/packages", async ({
  page,
}) => {
  await page.goto("/register");
  await page.getByLabel("Nama lengkap").fill("Siswa Uji");
  await page
    .getByLabel("Email", { exact: true })
    .fill(`student-${Date.now()}@example.com`);
  await page.getByLabel("Kata sandi").fill("Test-only-2026");
  await page.getByRole("button", { name: "Buat akun", exact: true }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(
    page.getByRole("heading", { name: "Halo, Siswa" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Mulai diagnostik", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Satu soal, satu langkah." }),
  ).toBeVisible();
  await expect(page.locator(".question-panel .katex").first()).toBeVisible();
  await page.getByRole("button", { name: /Pilihan B:/ }).click();
  await expect(
    page.getByText("Tersimpan di server", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: /Pilihan B:/ })).toHaveClass(
    /chosen/,
  );
  for (let i = 0; i < 15; i++) {
    await page
      .getByRole("button", { name: `Buka soal ${i + 1}`, exact: true })
      .click();
    await page.getByRole("button", { name: /Pilihan B:/ }).click();
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
    page.getByRole("heading", { name: "Materi belajar belum diterbitkan" }),
  ).toBeVisible();
  expect(
    await page.evaluate(async () => (await fetch("/api/admin/content")).status),
  ).toBe(403);
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
});

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

test("mobile student app fits viewport and bottom navigation opens learning", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/register");
  await page.getByLabel("Nama lengkap").fill("Siswa Mobile");
  await page
    .getByLabel("Email", { exact: true })
    .fill(`mobile-${Date.now()}@example.com`);
  await page.getByLabel("Kata sandi").fill("Test-only-2026");
  await page.getByRole("button", { name: "Buat akun", exact: true }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(
    page.getByRole("heading", { name: "Halo, Siswa" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: "Belajar", exact: true }).last().click();
  await expect(
    page.getByRole("heading", { name: "Materi belajar belum diterbitkan" }),
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

for (const kind of ["diagnostic"])
  test(`expired ${kind} rejects late answers and finalizes once`, async ({
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
      await post({ action: "start", kind, packageSlug: "pk-01-v2" })
    ).json();
    await post({
      action: "answer",
      id: a.id,
      questionId: a.questions[0].id,
      selected: 0,
    });
    const resumed = await (
      await post({ action: "start", kind, packageSlug: "pk-01-v2" })
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

test("pending Supabase signup explains confirmation and returns to login", async ({
  page,
}) => {
  await page.route("**/api/action", async (route) => {
    const request = route.request();
    if (request.method() === "GET") {
      await route.fulfill({ json: { user: null, backend: "supabase" } });
    } else if (request.postDataJSON().action === "register") {
      await route.fulfill({
        json: { confirmationRequired: true, backend: "supabase" },
      });
    } else {
      await route.fulfill({
        status: 401,
        json: {
          error:
            "Email belum dikonfirmasi. Buka tautan konfirmasi di email Anda, lalu masuk kembali.",
        },
      });
    }
  });

  await page.goto("/register");
  await page.getByLabel("Nama lengkap").fill("Siswa Konfirmasi");
  await page
    .getByLabel("Email", { exact: true })
    .fill("confirmation@example.com");
  await page.getByLabel("Kata sandi").fill("fixture-password-123");
  await page.getByRole("button", { name: "Buat akun", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Konfirmasi email terlebih dahulu." }),
  ).toBeVisible();
  await expect(page.getByLabel("Kata sandi")).toHaveCount(0);
  await page.getByRole("link", { name: /Ke halaman masuk/ }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page
    .getByLabel("Email", { exact: true })
    .fill("confirmation@example.com");
  await page.getByLabel("Kata sandi").fill("fixture-password-123");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Email belum dikonfirmasi");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Selamat datang kembali." }),
  ).toBeVisible();
  await expect(page.getByLabel("Nama lengkap")).toHaveCount(0);
});

test("contextual reports persist trusted version metadata and do not change answers", async ({
  request: rawRequest,
}) => {
  const request = localApi(rawRequest),
    post = (data: unknown) =>
      request.post("/api/action", {
        data,
        headers: { origin: "http://127.0.0.1:3000" },
      });
  await post({
    action: "register",
    email: `report-${Date.now()}@example.com`,
    name: "Report Test",
    password: "Test-only-2026",
  });
  const { attempt: a } = await (
    await post({ action: "start", kind: "diagnostic" })
  ).json();
  const payload = {
    action: "reportIssue",
    id: a.id,
    questionId: a.questions[0].id,
    category: "question",
    view: "exam",
    message: "TEST_ONLY wording review",
  };
  expect((await post(payload)).status()).toBe(200);
  expect((await post(payload)).status()).toBe(200);
  const { DatabaseSync } = await import("node:sqlite"),
    { resolve } = await import("node:path"),
    db = new DatabaseSync(
      resolve(process.env.LEVELUP_DATA_DIR!, "levelup.sqlite"),
    );
  try {
    const rows = db
      .prepare("select context from reports where attempt_id=?")
      .all(a.id);
    expect(rows).toHaveLength(1);
    expect(JSON.parse(String(rows[0].context))).toMatchObject({
      version: a.questions[0].version,
      topic: a.questions[0].topic,
      kind: "diagnostic",
      status: "active",
    });
  } finally {
    db.close();
  }
  expect(
    (await (await request.get(`/api/action?attempt=${a.id}`)).json()).attempt
      .answers,
  ).toEqual({});
  expect((await post({ ...payload, questionId: "forged" })).status()).toBe(400);
  expect(
    (
      await post({
        action: "reportIssue",
        category: "technical",
        view: "practice",
        topic: a.questions[0].topic,
        message: "TEST_ONLY page report",
      })
    ).status(),
  ).toBe(200);
});
