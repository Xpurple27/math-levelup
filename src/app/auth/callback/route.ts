import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { appOrigin } from "@/lib/site-url";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const requestedNext = request.nextUrl.searchParams.get("next") || "/app";
  const next = requestedNext.startsWith("/") ? requestedNext : "/app";
  const origin = appOrigin(request);
  const success = new URL(next, origin);
  const failure = new URL("/login", origin);

  if (code) {
    try {
      const client = await createSupabaseServerClient();
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(success);
    } catch {}
  }

  failure.searchParams.set("auth_error", "google");
  return NextResponse.redirect(failure);
}
