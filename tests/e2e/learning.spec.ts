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

for (const kind of ["diagnostic", "tryout"])
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
    expect(expired.attempt.result.unanswered).toBe(kind === "tryout" ? 19 : 14);
    const before = await (await request.get("/api/action")).json();
    await post({ action: "submit", id: a.id });
    const after = await (await request.get("/api/action")).json();
    expect(after.mastery).toEqual(before.mastery);
    expect(after.history).toHaveLength(1);
  });

test("new topic search, practice filters, fresh-first selection, and frozen resume", async ({
  page,
}) => {
  const api = localApi(page.request),
    origin = "http://127.0.0.1:3000";
  const post = (data: unknown) =>
    api.post("/api/action", { headers: { origin }, data });
  await post({
    action: "register",
    name: "Konten Baru",
    email: `content-${Date.now()}@example.com`,
    password: "test-password-123",
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Halo, Konten" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Belajar", exact: true }).click();
  await page.getByLabel("Cari materi").fill("geometri");
  await page
    .getByRole("button", { name: "Luas, keliling & volume", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Luas, keliling & volume", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Latihan", exact: true }).click();
  await page.getByLabel("Bagian UTBK").selectOption("PK");
  await page
    .getByRole("combobox", { name: "Subtopik", exact: true })
    .selectOption("persen");
  await page.getByLabel("Jumlah soal").selectOption("20");
  await page.getByLabel("Tingkat kesulitan").selectOption("Hard");
  await expect(page.getByLabel("Jumlah soal")).toHaveValue("10");
  await page.getByLabel("Jumlah soal").selectOption("5");
  await page
    .getByRole("button", { name: "Mulai latihan", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Satu soal, satu langkah." }),
  ).toBeVisible();
  const id = await page.evaluate(() => localStorage.getItem("levelup-attempt"));
  const initial = await (await api.get(`/api/action?attempt=${id}`)).json();
  expect(initial.attempt.questions).toHaveLength(5);
  expect(
    initial.attempt.questions.every(
      (q: { topic: string; difficulty: string }) =>
        q.topic === "persen" && q.difficulty === "Hard",
    ),
  ).toBe(true);
  const resumed = await (
    await post({
      action: "start",
      kind: "practice",
      topic: "persen",
      count: 10,
      difficulty: "Basic",
    })
  ).json();
  expect(resumed.attempt.id).toBe(id);
  expect(resumed.attempt.questions).toEqual(initial.attempt.questions);
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
  await expect(
    page.getByRole("heading", { name: "Satu langkah maju. Kerja bagus!" }),
  ).toBeVisible();
  const next = await (
    await post({
      action: "start",
      kind: "practice",
      topic: "persen",
      count: 5,
      difficulty: "Hard",
    })
  ).json();
  expect(next.attempt.id).not.toBe(id);
  expect(
    next.attempt.questions.every(
      (q: { id: string }) =>
        !initial.attempt.questions.some((p: { id: string }) => p.id === q.id),
    ),
  ).toBe(true);
  expect(
    (
      await post({
        action: "start",
        kind: "practice",
        topic: "pola",
        count: 20,
        difficulty: "Hard",
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await post({
        action: "start",
        kind: "practice",
        topic: "pola",
        count: 5,
        difficulty: "wrong",
      })
    ).status(),
  ).toBe(400);
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
  await page.goto("/");
  await page.getByRole("button", { name: "Mulai diagnostik gratis" }).click();
  await page.getByLabel("Nama lengkap").fill("Siswa Konfirmasi");
  await page
    .getByLabel("Email", { exact: true })
    .fill("confirmation@example.com");
  await page.getByLabel("Kata sandi").fill("fixture-password-123");
  await page.getByRole("button", { name: "Buat akun", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", { name: "Konfirmasi email terlebih dahulu" }),
  ).toBeVisible();
  await expect(dialog.getByLabel("Kata sandi")).toHaveCount(0);
  await dialog.getByRole("button", { name: "Sudah konfirmasi? Masuk" }).click();
  await dialog
    .getByLabel("Email", { exact: true })
    .fill("confirmation@example.com");
  await dialog.getByLabel("Kata sandi").fill("fixture-password-123");
  await dialog.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText(
    "Email belum dikonfirmasi",
  );
  await page.reload();
  await page.getByRole("button", { name: "Mulai diagnostik gratis" }).click();
  await expect(
    dialog.getByRole("heading", { name: "Selamat datang kembali." }),
  ).toBeVisible();
  await expect(dialog.getByLabel("Nama lengkap")).toHaveCount(0);
});

for (const packageNumber of ["01", "02"])
  test(`package ${packageNumber}: catalog → fixed test with resume → result tabs → history and repeat`, async ({
    page,
    request: rawRequest,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Mulai diagnostik gratis" }).click();
    await page.getByLabel("Nama lengkap").fill("Paket Uji");
    await page
      .getByLabel("Email", { exact: true })
      .fill(`paket-${Date.now()}@example.com`);
    await page.getByLabel("Kata sandi").fill("fixture-package-123");
    await page.getByRole("button", { name: "Buat akun", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Halo, Paket" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Tryout UTBK" }).click();
    await page.getByLabel("Bagian paket").selectOption("PK");
    await expect(
      page.getByRole("button", { name: "Detail PM — Paket 01" }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: `Detail PK — Paket ${packageNumber}` })
      .click();
    await expect(
      page.getByRole("region", { name: "Detail paket" }),
    ).toContainText("20 soal · 20 menit");
    const started = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/action") &&
        r.request().method() === "POST" &&
        r.request().postDataJSON().action === "start",
    );
    await page.getByRole("button", { name: "Mulai / lanjutkan paket" }).click();
    const { attempt: initial } = await (await started).json();
    expect(initial.kind).toBe("tryout");
    expect(initial.topic).toBe(
      packageNumber === "01" ? "pk-01-v2" : "pk-02-v1",
    );
    expect(initial.questions).toHaveLength(20);
    expect(initial.deadline - initial.started).toBe(1200000);
    expect(
      initial.questions.every(
        (q: Record<string, unknown>) =>
          q.correct === undefined &&
          q.explanation === undefined &&
          q.hint === undefined,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: /Pilihan A:/ }).click();
    await expect(
      page.getByText("Tersimpan di server", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Jawaban benar", { exact: true })).toHaveCount(
      0,
    );
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Satu soal, satu langkah." }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Selesaikan sesi", exact: true })
      .click();
    await page.getByRole("button", { name: "Kirim jawaban" }).click();
    await expect(
      page.getByRole("heading", { name: `Hasil PK — Paket ${packageNumber}` }),
    ).toBeVisible();
    await page.getByRole("tab", { name: "Analisis", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Rasio & perbandingan" }),
    ).toBeVisible();
    await page.getByRole("tab", { name: "Pembahasan", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Pembahasan lengkap" }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Lanjut belajar", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Contoh yang dikerjakan" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Tryout UTBK" }).click();
    await page
      .getByRole("button", { name: `Detail PK — Paket ${packageNumber}` })
      .click();
    await expect(
      page.getByRole("button", { name: /Lihat hasil/ }),
    ).toBeVisible();
    const repeated = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/action") &&
        r.request().method() === "POST" &&
        r.request().postDataJSON().action === "start",
    );
    await page.getByRole("button", { name: "Mulai / lanjutkan paket" }).click();
    const { attempt: next } = await (await repeated).json();
    expect(next.id).not.toBe(initial.id);
    expect(next.questions).toEqual(initial.questions);
    const other = localApi(rawRequest);
    await other.post("/api/action", {
      headers: { origin: "http://127.0.0.1:3000" },
      data: {
        action: "register",
        name: "Paket Lain",
        email: `other-paket-${Date.now()}@example.com`,
        password: "fixture-password-123",
      },
    });
    expect(
      (await other.get(`/api/action?attempt=${initial.id}`)).status(),
    ).toBe(404);
    expect(
      (
        await other.post("/api/action", {
          headers: { origin: "http://127.0.0.1:3000" },
          data: {
            action: "start",
            kind: "tryout",
            packageSlug: "forged-premium",
          },
        })
      ).status(),
    ).toBe(400);
  });
