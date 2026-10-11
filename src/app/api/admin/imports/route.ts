import {
  adminIdentity,
  assertOrigin,
  adminError,
} from "@/features/content/auth";
import { adminContent, contentRPC } from "@/features/content/db";
import { limitedBody } from "@/features/content/requests";
import { parseWorkbook } from "@/features/content/excel";
import { parseDocx } from "@/features/content/docx";
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
      const before = (await adminContent(user.id, "import_detail", {
        id: b.id,
      })) as {
        rows?: Array<{
          row_number: number;
          parsed_json?: { question_type?: string } | null;
        }>;
      };
      const data = await adminContent(user.id, "import_confirm", { id: b.id });
      const after = (await adminContent(user.id, "import_detail", {
        id: b.id,
      })) as {
        rows?: Array<{ row_number: number; question_id?: string | null }>;
      };
      for (const imported of after.rows || []) {
        const parsed = before.rows?.find(
          (r) => r.row_number === imported.row_number,
        )?.parsed_json;
        if (
          !imported.question_id ||
          !parsed?.question_type ||
          parsed.question_type === "SINGLE_CHOICE"
        )
          continue;
        const detail = (await adminContent(user.id, "detail", {
          id: imported.question_id,
        })) as { versions?: Array<{ id: string }> };
        const versionId = detail.versions?.[0]?.id;
        if (versionId)
          await contentRPC("levelup_question_set_type", {
            p_actor: user.id,
            p_version: versionId,
            p_type: parsed.question_type,
          });
      }
      return Response.json(
        { data },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    const bytes = await limitedBody(request, 8500000),
      form = await new Request(request.url, {
        method: "POST",
        headers: { "content-type": request.headers.get("content-type") || "" },
        body: bytes as unknown as BodyInit,
      }).formData(),
      file = form.get("file");
    if (!(file instanceof File))
      throw new StorageError("Pilih file .xlsx atau .docx.", 400);
    const name = file.name.toLowerCase();
    const isXlsx = name.endsWith(".xlsx");
    const isDocx = name.endsWith(".docx");
    if (!isXlsx && !isDocx)
      throw new StorageError(
        "Format yang didukung saat ini: .xlsx dan .docx.",
        400,
      );
    if (isXlsx && file.size > 2_200_000)
      throw new StorageError("XLSX maksimal 2 MB.", 400);
    if (isDocx && file.size > 8_000_000)
      throw new StorageError("DOCX maksimal 8 MB.", 400);

    const job = await adminContent<{ id: string }>(user.id, "import_begin", {
      file_name: file.name.slice(0, 200),
    });
    try {
      await adminContent(user.id, "import_parsing", { id: job.id });
      const catalog = await adminContent<Catalog>(user.id, "catalog");
      let preview;
      if (isXlsx) {
        const codes = await adminContent<string[]>(user.id, "codes");
        preview = await parseWorkbook(
          new Uint8Array(await file.arrayBuffer()),
          catalog,
          codes,
        );
      } else {
        const section_id = String(form.get("section_id") || "");
        const subtopic_id = String(form.get("subtopic_id") || "");
        const difficulty = String(
          form.get("difficulty") || "MEDIUM",
        ).toUpperCase();
        preview = await parseDocx(
          new Uint8Array(await file.arrayBuffer()),
          catalog,
          {
            section_id,
            subtopic_id,
            difficulty,
            source_title: file.name.slice(0, 200),
          },
        );
      }
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
