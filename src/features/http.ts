import "server-only";
import { NextResponse } from "next/server";
import { onlineBackend } from "@/lib/backend";
export const cookie = "levelup_session";
export type ActionBody = Record<string, unknown> & { action: string };
export function response(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(
    { ...data, backend: onlineBackend() ? "supabase" : "local" },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
