import "server-only";
import { StorageError } from "../../lib/store-errors";
import { sourceTypes } from "./model";
export async function limitedBody(request: Request, max = 1024 * 1024) {
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const parts: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > max) {
      await reader.cancel();
      throw new StorageError("Ukuran upload/payload melebihi batas.", 413);
    }
    parts.push(value);
  }
  const out = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}
export function validateDraft(p: Record<string, unknown>) {
  if (
    !["BASIC", "MEDIUM", "HARD"].includes(String(p.difficulty)) ||
    typeof p.section_id !== "string" ||
    typeof p.subtopic_id !== "string" ||
    !sourceTypes.includes(p.source_type as (typeof sourceTypes)[number]) ||
    !Array.isArray(p.options) ||
    p.options.length > 5 ||
    p.options.some(
      (o) =>
        !o ||
        typeof o.content_md !== "string" ||
        typeof o.is_correct !== "boolean" ||
        !["A", "B", "C", "D", "E"].includes(o.option_key),
    ) ||
    !p.explanation ||
    typeof p.explanation !== "object"
  )
    throw new StorageError("Field draft tidak valid.", 400);
}
