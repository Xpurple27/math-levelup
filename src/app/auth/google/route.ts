import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { appOrigin } from "@/lib/site-url";

export async function GET(request: NextRequest) {
  const origin = appOrigin(request);
  const fallback = new URL("/login", origin);

  try {
    const client = await createSupabaseServerClient();
    const redirectTo = new URL("/auth/callback?next=/app", origin).toString();
    const { data, error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          access_type: "offline",
          prompt: "select_account",
        },
      },
    });

    if (!error && data.url) return NextResponse.redirect(data.url);
  } catch {}

  fallback.searchParams.set("auth_error", "google");
  return NextResponse.redirect(fallback);
}
