import { mediaUrl } from "@/features/content/runtime";
import type { Media } from "@/features/content/model";
import {
  adminIdentity,
  assertOrigin,
  adminError,
} from "@/features/content/auth";
import { adminContent } from "@/features/content/db";
import { limitedBody, validateDraft } from "@/features/content/requests";
import { StorageError } from "@/lib/store-errors";
export const runtime = "nodejs";
const reply = (data: unknown) =>
  Response.json({ data }, { headers: { "Cache-Control": "no-store" } });
export async function GET(request: Request) {
  try {
    const { user } = await adminIdentity(),
      url = new URL(request.url),
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
        ? (data as Media[]).map((m) => ({ ...m, url: mediaUrl(m) }))
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
      ].includes(b.action) ||
      !b.payload ||
      typeof b.payload !== "object"
    )
      throw new StorageError("Action tidak valid.", 400);
    if (b.action === "create" || b.action === "save") validateDraft(b.payload);
    return reply(await adminContent(user.id, b.action, b.payload));
  } catch (e) {
    return adminError(e);
  }
}
