import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
async function run(smoke: boolean, broken = false) {
  const log: string[] = [],
    calls: Record<string, unknown>[] = [],
    state = { logged: false };
  const process = {
    env: {
      LEVELUP_HOSTED_URL: "https://pilot.example",
      LEVELUP_PILOT_EMAIL: "fixture@example.com",
      LEVELUP_PILOT_PASSWORD: "fixture-password",
    },
    argv: smoke ? ["node", "script", "--learning-smoke"] : ["node", "script"],
    exitCode: 0,
  };
  const a = {
    id: "fixture-id",
    questions: Array.from({ length: 20 }, (_, i) => ({
      id: `q${i}`,
      version: 2,
    })),
    started: 0,
    deadline: 1200000,
    answers: {} as Record<string, number>,
    status: "active",
    result: null as unknown,
  };
  const json = (
    data: unknown,
    status = 200,
    headers: Record<string, string> = {},
  ) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "content-type": "application/json", ...headers },
    });
  await runInNewContext(
    `(async()=>{${readFileSync("scripts/verify-hosted.mjs", "utf8")}})()`,
    {
      process,
      URL,
      Map,
      AbortSignal,
      console: {
        log: (v: string) => log.push(v),
        error: (v: string) => log.push(v),
      },
      fetch: async (target: string, options: RequestInit) => {
        if (target === "https://pilot.example/") return new Response("Fixture");
        if (!options.body) {
          if (target.includes("?attempt=")) return json({ attempt: a });
          return json({
            backend: "supabase",
            user: state.logged ? { id: "verified-user" } : null,
            ...(state.logged
              ? {
                  mastery: [{ topic: "rasio", count: 20, confidence: 0.5 }],
                  history: a.status === "completed" ? [{ id: a.id }] : [],
                  ...(broken ? { notice: "storage unavailable" } : {}),
                }
              : {}),
          });
        }
        const b = JSON.parse(String(options.body));
        calls.push(b);
        if (
          (options.headers as Record<string, string>).Origin ===
          "https://invalid.example"
        )
          return json({}, 403);
        if (b.action === "login") {
          state.logged = true;
          return json({ user: { id: "verified-user" } }, 200, {
            "set-cookie": "session=fixture-cookie; HttpOnly",
          });
        }
        if (!state.logged) return json({}, 401);
        if (b.action === "logout") {
          state.logged = false;
          return json({ ok: true });
        }
        if (b.action === "start") return json({ attempt: a });
        if (b.action === "answer") {
          a.answers[b.questionId] = b.selected;
          return json({ attempt: a });
        }
        if (b.action === "reportIssue") return json({ reported: true });
        if (b.action === "submit") {
          a.status = "completed";
          a.result = { score: 0 };
          return json({ attempt: a });
        }
        return json({}, 400);
      },
    },
  );
  return { code: process.exitCode, log: log.join("\n"), calls };
}
it("hosted verifier separates read-only checks from deliberate smoke writes without logging credentials", async () => {
  const publicChecks = await run(false);
  expect(publicChecks.code).toBe(0);
  expect(
    publicChecks.calls.some(
      (c) => c.action === "login" || c.action === "answer",
    ),
  ).toBe(false);
  expect(publicChecks.log).toContain("NOT RUN");
  const smoke = await run(true);
  expect(smoke.code).toBe(0);
  expect(smoke.calls.filter((c) => c.action === "answer")).toHaveLength(20);
  expect(smoke.log).toContain("PASS Progress available");
  expect(smoke.log).not.toContain("fixture-password");
  expect(smoke.log).not.toContain("fixture-cookie");
  expect(smoke.log).not.toContain("fixture@example.com");
});
it("hosted verifier exits nonzero when storage is unavailable instead of accepting an empty progress fallback", async () => {
  const result = await run(true, true);
  expect(result.code).toBe(1);
  expect(result.log).toContain("FAIL Progress available");
});
