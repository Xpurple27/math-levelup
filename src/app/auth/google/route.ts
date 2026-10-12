import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const fallback = new URL("/login", request.url);
  try {
    const client = await createSupabaseServerClient();
    const redirectTo = new URL("/auth/callback", request.url).toString();
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
