import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
/** Optional SSR integration baseline. The current application uses the SQLite adapter. */
export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key)
    throw new Error(
      "Supabase is not configured. The local MVP does not require Supabase.",
    );
  const jar = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return jar.getAll();
      },
      setAll(
        values: { name: string; value: string; options: CookieOptions }[],
      ) {
        for (const { name, value, options } of values)
          jar.set(name, value, options);
      },
    },
  });
}
