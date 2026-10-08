// Never print cookies, credentials, response bodies, or personal account data.
const target = process.env.LEVELUP_HOSTED_URL;
if (!target) {
  console.error("Set LEVELUP_HOSTED_URL to the Vercel HTTPS origin.");
  process.exit(1);
}
const url = new URL(target);
if (
  url.protocol !== "https:" ||
  url.pathname !== "/" ||
  url.search ||
  url.hash ||
  url.username ||
  url.password
) {
  console.error("Use an HTTPS origin without credentials or a path.");
  process.exit(1);
}
const origin = url.origin;
let cookies = new Map();
let failed = false;
async function request(path, body, source = origin) {
  const response = await fetch(origin + path, {
    method: body ? "POST" : "GET",
    redirect: "manual",
    signal: AbortSignal.timeout(20000),
    headers: {
      ...(body ? { "Content-Type": "application/json", Origin: source } : {}),
      Cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join("; "),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  for (const c of response.headers.getSetCookie()) {
    const pair = c.split(";")[0],
      i = pair.indexOf("=");
    cookies.set(pair.slice(0, i), pair.slice(i + 1));
  }
  let data = {};
  if (response.headers.get("content-type")?.includes("application/json"))
    data = await response.json();
  return { status: response.status, data };
}
function check(name, ok) {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}`);
  if (!ok) {
    failed = true;
    throw new Error("check failed");
  }
}
try {
  check("Vercel page responds", (await request("/")).status === 200);
  let r = await request("/api/action");
  check(
    "Online backend and anonymous session",
    r.status === 200 &&
      r.data.backend === "supabase" &&
      r.data.user === null &&
      !r.data.notice,
  );
  check(
    "Anonymous writes denied",
    (
      await request("/api/action", {
        action: "start",
        kind: "tryout",
        packageSlug: "pk-pilot-v1",
      })
    ).status === 401,
  );
  check(
    "Cross-origin writes denied",
    (
      await request(
        "/api/action",
        { action: "start" },
        "https://invalid.example",
      )
    ).status === 403,
  );
  if (process.argv.includes("--learning-smoke")) {
    const email = process.env.LEVELUP_PILOT_EMAIL,
      password = process.env.LEVELUP_PILOT_PASSWORD;
    if (!email || !password) throw new Error("missing test credentials");
    r = await request("/api/action", { action: "login", email, password });
    check("Confirmed test account login", r.status === 200 && !!r.data.user);
    r = await request("/api/action", {
      action: "start",
      kind: "tryout",
      packageSlug: "pk-pilot-v1",
    });
    const a = r.data.attempt;
    check(
      "Pilot start and private keys",
      r.status === 200 &&
        a?.questions?.length === 20 &&
        a.deadline - a.started === 1200000 &&
        a.questions.every(
          (q) => q.version === 2 && !("correct" in q) && !("explanation" in q),
        ),
    );
    for (const q of a.questions)
      check(
        "Answer autosave",
        (
          await request("/api/action", {
            action: "answer",
            id: a.id,
            questionId: q.id,
            selected: 0,
          })
        ).status === 200,
      );
    r = await request(`/api/action?attempt=${encodeURIComponent(a.id)}`);
    check(
      "Reload retains answers",
      Object.keys(r.data.attempt?.answers || {}).length === 20,
    );
    r = await request("/api/action", {
      action: "reportIssue",
      id: a.id,
      questionId: a.questions[0].id,
      category: "technical",
      view: "exam",
      message: "Hosted pilot verification: test report.",
    });
    check(
      "Contextual report persisted",
      r.status === 200 && r.data.reported === true,
    );
    r = await request("/api/action", { action: "submit", id: a.id });
    check(
      "Server finalization",
      r.status === 200 &&
        r.data.attempt?.status === "completed" &&
        !!r.data.attempt.result,
    );
    const result = JSON.stringify(r.data.attempt.result);
    r = await request("/api/action", { action: "submit", id: a.id });
    check(
      "Duplicate submit immutable",
      r.status === 200 && JSON.stringify(r.data.attempt?.result) === result,
    );
    r = await request("/api/action");
    check(
      "Progress available",
      r.status === 200 &&
        !!r.data.user &&
        !r.data.notice &&
        Array.isArray(r.data.mastery) &&
        r.data.mastery.some((m) => Number(m.count) > 0) &&
        r.data.mastery.every(
          (m) =>
            typeof m.confidence === "number" &&
            m.confidence >= 0 &&
            m.confidence <= 1 &&
            !("uniqueEvidence" in m),
        ) &&
        Array.isArray(r.data.history) &&
        r.data.history.some((h) => h.id === a.id),
    );
    await request("/api/action", { action: "logout" });
    check("Logout", (await request("/api/action")).data.user === null);
  } else
    console.log(
      "NOT RUN authenticated learning smoke; use --learning-smoke with a dedicated confirmed test account.",
    );
  console.log(
    "NOT VERIFIED SQL permissions/backfill and human content QA; complete docs/pilot-release.md.",
  );
} catch {
  failed = true;
  console.error(
    "Hosted verification stopped. Check deployment, test-account settings, and SQL checklist; credentials and responses omitted.",
  );
}
process.exitCode = failed ? 1 : 0;
