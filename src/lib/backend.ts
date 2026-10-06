/** Vercel always uses online persistence: never fall back to ephemeral SQLite. */
export function onlineBackend() {
  return (
    process.env.VERCEL === "1" || process.env.LEVELUP_BACKEND === "supabase"
  );
}
