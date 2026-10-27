import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresh the Supabase auth session for server-rendered requests.
 *
 * Authorization still happens in the existing route/page handlers with getUser().
 * This helper only keeps the access/refresh-token cookies synchronized between
 * the incoming request and outgoing response, which is required for SSR auth.
 */
export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[],
      ) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        response = NextResponse.next({ request });
        response.headers.set("Cache-Control", "private, no-store");
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  try {
    // getClaims verifies the token and refreshes it when needed. Do not replace
    // this with getSession(), which only trusts the cookie payload.
    await supabase.auth.getClaims();
  } catch {
    // Public pages should remain reachable while Auth/Supabase is unavailable.
    // Protected routes still enforce identity in their existing handlers.
  }

  return response;
}
