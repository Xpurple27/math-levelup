import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const success = new URL("/app", request.url);
  const failure = new URL("/login", request.url);

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
