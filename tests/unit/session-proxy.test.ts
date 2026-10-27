import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { updateSession } from "@/lib/supabase/proxy";

vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn() }));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});

it("leaves unconfigured local requests alone", async () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  const r = await updateSession(new NextRequest("https://example.com/app"));
  expect(r.status).toBe(200);
  expect(createServerClient).not.toHaveBeenCalled();
});

it("synchronizes verified refresh cookies into request and private response", async () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fixture.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "TEST_ONLY_PUBLISHABLE");
  const claims = vi.fn(async () => ({ data: { claims: {} }, error: null }));
  vi.mocked(createServerClient).mockImplementation((_url, _key, options) => {
    const cookies = options!.cookies as {
      setAll: (
        items: {
          name: string;
          value: string;
          options: { httpOnly: boolean; path: string };
        }[],
      ) => void;
    };
    claims.mockImplementation(async () => {
      cookies.setAll([
        {
          name: "sb-fixture-auth-token",
          value: "TEST_ONLY_REFRESHED",
          options: { httpOnly: true, path: "/" },
        },
      ]);
      return { data: { claims: {} }, error: null };
    });
    return { auth: { getClaims: claims } } as unknown as ReturnType<
      typeof createServerClient
    >;
  });
  const request = new NextRequest("https://example.com/app");
  const response = await updateSession(request);
  expect(claims).toHaveBeenCalledOnce();
  expect(request.cookies.get("sb-fixture-auth-token")?.value).toBe(
    "TEST_ONLY_REFRESHED",
  );
  expect(response.cookies.get("sb-fixture-auth-token")?.value).toBe(
    "TEST_ONLY_REFRESHED",
  );
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.get("set-cookie")).toContain("HttpOnly");
});

it("keeps a public request available when Auth fails without granting identity", async () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fixture.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "TEST_ONLY_PUBLISHABLE");
  vi.mocked(createServerClient).mockReturnValue({
    auth: {
      getClaims: vi.fn().mockRejectedValue(new Error("TEST_ONLY_UNAVAILABLE")),
    },
  } as unknown as ReturnType<typeof createServerClient>);
  const r = await updateSession(new NextRequest("https://example.com/"));
  expect(r.status).toBe(200);
  expect(r.cookies.getAll()).toEqual([]);
});
