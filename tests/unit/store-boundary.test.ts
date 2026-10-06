import { it, expect, vi, afterEach } from "vitest";
const getAttempt = vi.hoisted(() => vi.fn(async () => null));
vi.mock("../../src/lib/store-local", () => ({ getAttempt }));
vi.mock("../../src/lib/store-supabase", () => ({ getAttempt }));
import * as store from "../../src/lib/store";
afterEach(() => {
  vi.unstubAllEnvs();
  getAttempt.mockClear();
});
it.each(["local", "supabase"])(
  "%s lookup rejects malformed UUIDs and always forwards verified owner",
  async (backend) => {
    vi.stubEnv("VERCEL", "0");
    vi.stubEnv("LEVELUP_BACKEND", backend);
    expect(await store.getAttempt("malformed-id", "verified-owner")).toBeNull();
    expect(getAttempt).not.toHaveBeenCalled();
    const id = "00000000-0000-4000-8000-000000000001";
    expect(await store.getAttempt(id, "verified-owner")).toBeNull();
    expect(getAttempt).toHaveBeenCalledWith(id, "verified-owner");
  },
);
