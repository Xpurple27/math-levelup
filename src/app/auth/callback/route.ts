import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const target = new URL("/", request.url);
  if (code) {
    try {
      const client = await createSupabaseServerClient();
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(target);
    } catch {}
  }
  target.searchParams.set("auth_error", "confirmation");
  return NextResponse.redirect(target);
}
