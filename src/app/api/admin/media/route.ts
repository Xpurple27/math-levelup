import { createClient } from "@supabase/supabase-js";
import {
  adminIdentity,
  assertOrigin,
  adminError,
} from "@/features/content/auth";
import { adminContent } from "@/features/content/db";
import { limitedBody } from "@/features/content/requests";
import { StorageError } from "@/lib/store-errors";

export const runtime = "nodejs";

const allowed = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
  "image/svg+xml",
  "application/pdf",
]);

export async function POST(request: Request) {
  try {
    const { user, role } = await adminIdentity();
    if (role !== "ADMIN") throw new StorageError("Akses media ditolak.", 403);
    assertOrigin(request);
    const bytes = await limitedBody(request, 5_500_000);
    const form = await new Request(request.url, {
      method: "POST",
      headers: { "content-type": request.headers.get("content-type") || "" },
      body: bytes as unknown as BodyInit,
    }).formData();
    const file = form.get("file");
    if (!(file instanceof File))
      throw new StorageError("Pilih file media.", 400);
    if (!allowed.has(file.type))
      throw new StorageError("Format media tidak didukung.", 400);
    if (file.size > 5_000_000)
      throw new StorageError("Media maksimal 5 MB.", 400);

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key)
      throw new StorageError("Supabase Storage belum dikonfigurasi.", 500);
    const bucket = process.env.LEVELUP_MEDIA_BUCKET || "levelup-content";
    const ext = file.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] || "bin";
    const now = new Date();
    const path = `question-media/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.${ext}`;
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await client.storage
      .from(bucket)
      .upload(path, await file.arrayBuffer(), {
        contentType: file.type,
        cacheControl: "31536000",
        upsert: false,
      });
    if (error) {
      if (/bucket/i.test(error.message))
        throw new StorageError(
          `Bucket '${bucket}' belum tersedia. Buat bucket private tersebut di Supabase Storage.`,
          500,
        );
      throw new StorageError(error.message, 500);
    }
    const kind =
      file.type === "application/pdf"
        ? "DOCUMENT"
        : file.type === "image/svg+xml"
          ? "DIAGRAM"
          : "IMAGE";
    const data = await adminContent(user.id, "media_create", {
      kind,
      original_filename: file.name.slice(0, 200),
      storage_path: `${bucket}/${path}`,
      mime_type: file.type,
      file_size: String(file.size),
      width: "",
      height: "",
      alt_text: String(form.get("alt_text") || "").slice(0, 500),
      source_url: String(form.get("source_url") || "").slice(0, 1000),
    });
    return Response.json(
      { data },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return adminError(error);
  }
}
