import { mediaUrl } from "@/features/content/runtime";
import type { Media } from "@/features/content/model";
import {
  adminIdentity,
  assertOrigin,
  adminError,
} from "@/features/content/auth";
import { adminContent, contentRPC } from "@/features/content/db";
import { limitedBody, validateDraft } from "@/features/content/requests";
import { StorageError } from "@/lib/store-errors";
export const runtime = "nodejs";
const reply = (data: unknown) =>
  Response.json({ data }, { headers: { "Cache-Control": "no-store" } });
type Detail = { versions?: Array<{ id: string }> };
export async function GET(request: Request) {
  try {
    const { user } = await adminIdentity();
    const url = new URL(request.url),
      action = url.searchParams.get("action") || "list";
    if (
      ![
        "list",
        "catalog",
        "detail",
        "qa_list",
        "media_list",
        "imports",
        "import_detail",
      ].includes(action)
    )
      throw new StorageError("Action tidak valid.", 400);
    const data = await adminContent(
      user.id,
      action,
      Object.fromEntries(url.searchParams),
    );
    return reply(
      action === "media_list"
        ? await Promise.all(
            (data as Media[]).map(async (m) => ({
              ...m,
              url: await mediaUrl(m),
            })),
          )
        : data,
    );
  } catch (e) {
    return adminError(e);
  }
}
export async function POST(request: Request) {
  try {
    const { user } = await adminIdentity();
    assertOrigin(request);
    const b = JSON.parse(
      new TextDecoder().decode(await limitedBody(request)),
    ) as { action: string; payload: Record<string, unknown> };
    if (!b.payload || typeof b.payload !== "object")
      throw new StorageError("Action tidak valid.", 400);
    if (b.action === "taxonomy_create")
      return reply(
        await contentRPC("levelup_taxonomy_create", {
          p_actor: user.id,
          p_kind: String(b.payload.kind || ""),
          p_parent:
            typeof b.payload.parent_id === "string" && b.payload.parent_id
              ? b.payload.parent_id
              : null,
          p_name: String(b.payload.name || ""),
          p_code: String(b.payload.code || ""),
        }),
      );
    if (
      ![
        "create",
        "save",
        "revision",
        "send_qa",
        "publish",
        "delete_draft",
        "archive",
        "review",
        "media_create",
      ].includes(b.action)
    )
      throw new StorageError("Action tidak valid.", 400);
    if (b.action === "create" || b.action === "save") validateDraft(b.payload);
    let data = await adminContent(user.id, b.action, b.payload);
    if (
      (b.action === "create" || b.action === "save") &&
      typeof b.payload.question_type === "string"
    ) {
      const versionId = (data as Detail).versions?.[0]?.id;
      if (!versionId)
        throw new StorageError("Versi draft tidak ditemukan.", 500);
      data = await contentRPC("levelup_question_set_type", {
        p_actor: user.id,
        p_version: versionId,
        p_type: b.payload.question_type,
      });
    }
    return reply(data);
  } catch (e) {
    return adminError(e);
  }
}
