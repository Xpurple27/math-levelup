export async function adminGet<T>(
  action: string,
  params: Record<string, string> = {},
): Promise<T> {
  const r = await fetch(
      "/api/admin/content?" + new URLSearchParams({ action, ...params }),
      { cache: "no-store" },
    ),
    d = await r.json();
  if (!r.ok) throw new Error(d.error || "Gagal memuat konten.");
  return d.data;
}
export async function adminPost<T>(
  action: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const r = await fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload }),
    }),
    d = await r.json();
  if (!r.ok) throw new Error(d.error || "Gagal menyimpan konten.");
  return d.data;
}
