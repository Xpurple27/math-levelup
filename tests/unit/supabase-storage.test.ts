import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { selectQuestions } from "../../src/lib/content";
import type { Attempt } from "../../src/lib/store-types";
const rpc = vi.hoisted(() => vi.fn());
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ rpc }) }));
import { saveAttempt, finalize } from "../../src/lib/store-supabase";
beforeEach(() => {
  rpc.mockReset();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.example.com");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "fixture-server-key");
});
afterEach(() => vi.unstubAllEnvs());
function attempt(): Attempt {
  return {
    id: "fixture-attempt",
    user_id: "fixture-user",
    kind: "diagnostic",
    topic: null,
    started: 0,
    deadline: 9999999999999,
    revision: 0,
    snapshot: selectQuestions("diagnostic"),
    answers: {},
    feedback: {},
    credits: {},
    status: "active",
    result: null,
  };
}
describe("Supabase RPC conflict handling", () => {
  it("keeps failed autosave revisions unchanged and returns a retryable conflict", async () => {
    const a = attempt();
    rpc.mockResolvedValue({ data: false, error: null });
    await expect(saveAttempt(a)).rejects.toMatchObject({ status: 409 });
    expect(a.revision).toBe(0);
    rpc.mockResolvedValue({ data: true, error: null });
    await saveAttempt(a);
    expect(a.revision).toBe(1);
    expect(rpc).toHaveBeenLastCalledWith(
      "levelup_save_attempt",
      expect.objectContaining({
        p_id: a.id,
        p_user_id: a.user_id,
        p_version: 0,
      }),
    );
  });
  it("propagates database mastery races and treats duplicate finalization as a no-op", async () => {
    const a = attempt();
    rpc.mockResolvedValue({
      data: null,
      error: { code: "40001", message: "concurrent update" },
    });
    await expect(finalize(a, null, [], [])).rejects.toMatchObject({
      status: 409,
    });
    rpc.mockResolvedValue({ data: false, error: null });
    expect(await finalize(a, null, [], [])).toBe(false);
    expect(rpc).toHaveBeenLastCalledWith(
      "levelup_finalize_attempt",
      expect.objectContaining({
        p_user_id: a.user_id,
        p_version: 0,
        p_old: {},
      }),
    );
  });
});
