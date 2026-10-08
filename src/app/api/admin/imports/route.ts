import {
  adminIdentity,
  assertOrigin,
  adminError,
} from "@/features/content/auth";
import { adminContent } from "@/features/content/db";
import { limitedBody } from "@/features/content/requests";
import { parseWorkbook } from "@/features/content/excel";
import type { Catalog } from "@/features/content/model";
import { StorageError } from "@/lib/store-errors";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const { user, role } = await adminIdentity();
    if (role !== "ADMIN") throw new StorageError("Akses import ditolak.", 403);
    assertOrigin(request);
    if (request.headers.get("content-type")?.startsWith("application/json")) {
      const b = JSON.parse(
        new TextDecoder().decode(await limitedBody(request)),
      );
      if (b.action !== "confirm" || typeof b.id !== "string")
        throw new StorageError("Konfirmasi import tidak valid.", 400);
      return Response.json(
        { data: await adminContent(user.id, "import_confirm", { id: b.id }) },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    const bytes = await limitedBody(request, 2200000),
      form = await new Request(request.url, {
        method: "POST",
        headers: { "content-type": request.headers.get("content-type") || "" },
        body: bytes as unknown as BodyInit,
      }).formData(),
      file = form.get("file");
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".xlsx"))
      throw new StorageError("Upload file .xlsx.", 400);
    const job = await adminContent<{ id: string }>(user.id, "import_begin", {
      file_name: file.name.slice(0, 200),
    });
    try {
      await adminContent(user.id, "import_parsing", { id: job.id });
      const [catalog, codes] = await Promise.all([
        adminContent<Catalog>(user.id, "catalog"),
        adminContent<string[]>(user.id, "codes"),
      ]);
      const preview = await parseWorkbook(
        new Uint8Array(await file.arrayBuffer()),
        catalog,
        codes,
      );
      const data = await adminContent(user.id, "import_preview", {
        id: job.id,
        file_name: file.name,
        ...preview,
      });
      return Response.json(
        { data },
        { headers: { "Cache-Control": "no-store" } },
      );
    } catch (e) {
      await adminContent(user.id, "import_failed", {
        id: job.id,
        error: e instanceof Error ? e.message : "Parsing failed",
      });
      throw new StorageError(
        e instanceof Error ? e.message : "Parsing gagal.",
        400,
      );
    }
  } catch (e) {
    return adminError(e);
  }
}
