import { describe, it, expect, vi, beforeEach } from "vitest";
const auth = vi.hoisted(() => ({
  getUser: vi.fn(),
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("../../src/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ auth }),
}));
import {
  getUser,
  register,
  authenticate,
  logout,
} from "../../src/lib/store-supabase";
import { onlineBackend } from "../../src/lib/backend";
beforeEach(() => vi.clearAllMocks());
describe("Supabase identity adapter", () => {
  const user = {
    id: "verified-user",
    email: "student@example.com",
    user_metadata: {
      display_name: "Siswa",
      grade: "Kelas 12",
      goal: 700,
      role: "ADMIN",
    },
  };
  it("uses authoritative getUser identity, never local cookie or metadata roles", async () => {
    auth.getUser.mockResolvedValue({ data: { user }, error: null });
    expect(await getUser("forged-local-cookie")).toEqual({
      id: "verified-user",
      email: "student@example.com",
      name: "Siswa",
      grade: "Kelas 12",
      goal: 700,
    });
    expect(auth.getUser).toHaveBeenCalledOnce();
    auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "expired" },
    });
    expect(await getUser("old-cookie")).toBeNull();
  });
  it("keeps email confirmation distinct from a successful authenticated signup", async () => {
    auth.signUp.mockResolvedValue({
      data: { user, session: null },
      error: null,
    });
    expect(
      await register(
        "student@example.com",
        "Siswa",
        "password-123",
        "Kelas 12",
        700,
        "https://math.example.com",
      ),
    ).toEqual({ user: null, confirmationRequired: true });
    expect(auth.signUp).toHaveBeenCalledWith({
      email: "student@example.com",
      password: "password-123",
      options: {
        data: { display_name: "Siswa", grade: "Kelas 12", goal: 700 },
        emailRedirectTo: "https://math.example.com/auth/callback",
      },
    });
    auth.signUp.mockResolvedValue({
      data: { user, session: { access_token: "fixture" } },
      error: null,
    });
    expect(
      (
        await register(
          "student@example.com",
          "Siswa",
          "password-123",
          "Kelas 12",
          700,
          "https://math.example.com",
        )
      ).user?.id,
    ).toBe("verified-user");
  });
  it("handles login failures and signs out the Supabase session", async () => {
    auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid login" },
    });
    expect(await authenticate("student@example.com", "wrong")).toBeNull();
    auth.signOut.mockResolvedValue({ error: null });
    await logout();
    expect(auth.signOut).toHaveBeenCalledOnce();
  });
  it("never chooses local SQLite on Vercel", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("LEVELUP_BACKEND", "local");
    try {
      expect(onlineBackend()).toBe(true);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
