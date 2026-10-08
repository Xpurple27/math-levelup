import { beforeEach, describe, it, expect, vi } from "vitest";
import { StorageError } from "../../src/lib/store-errors";
const mocks = vi.hoisted(() => ({ identity: vi.fn(), content: vi.fn() }));
vi.mock("../../src/features/content/auth", async () => {
  const actual = await vi.importActual<
    typeof import("../../src/features/content/auth")
  >("../../src/features/content/auth");
  return { ...actual, adminIdentity: mocks.identity };
});
vi.mock("../../src/features/content/db", () => ({
  adminContent: mocks.content,
  contentRPC: vi.fn(),
  testContentAllowed: () => false,
}));
import { GET, POST } from "../../src/app/api/admin/content/route";
beforeEach(() => {
  mocks.identity
    .mockReset()
    .mockResolvedValue({ user: { id: "verified-admin" }, role: "ADMIN" });
  mocks.content.mockReset().mockResolvedValue({ deleted: true });
});
function req(action: string, payload: unknown, origin = "http://localhost") {
  return new Request("http://localhost/api/admin/content", {
    method: "POST",
    headers: { origin, "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload, user_id: "forged-student" }),
  });
}
describe("authoring API boundary", () => {
  it("uses verified identity and rejects cross-origin mutation", async () => {
    expect(
      (await POST(req("delete_draft", { version_id: "test" }))).status,
    ).toBe(200);
    expect(mocks.content).toHaveBeenCalledWith(
      "verified-admin",
      "delete_draft",
      { version_id: "test" },
    );
    mocks.content.mockClear();
    expect(
      (
        await POST(
          req("publish", { version_id: "test" }, "https://attacker.example"),
        )
      ).status,
    ).toBe(403);
    expect(mocks.content).not.toHaveBeenCalled();
  });
  it("denies student and anonymous reads without returning private content", async () => {
    mocks.identity.mockRejectedValue(new StorageError("Denied", 403));
    expect(
      (await GET(new Request("http://localhost/api/admin/content"))).status,
    ).toBe(403);
    expect(mocks.content).not.toHaveBeenCalled();
    mocks.identity.mockRejectedValue(new StorageError("Login", 401));
    expect((await POST(req("create", {}))).status).toBe(401);
  });
  it("validates drafts and disallows private import/RPC action tunneling", async () => {
    expect((await POST(req("create", { options: "bad" }))).status).toBe(400);
    expect((await POST(req("import_preview", {}))).status).toBe(400);
    expect(
      (
        await GET(
          new Request("http://localhost/api/admin/content?action=codes"),
        )
      ).status,
    ).toBe(400);
    expect(mocks.content).not.toHaveBeenCalled();
  });
});
