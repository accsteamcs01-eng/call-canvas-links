import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  upload: vi.fn(),
  signed: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser: mocks.getUser },
    storage: { from: () => ({ upload: mocks.upload, createSignedUrl: mocks.signed }) },
    rpc: mocks.rpc,
  },
}));

import { logCallEvent, uploadMedia } from "@/lib/calls";

afterEach(() => vi.resetAllMocks());

describe("Protected call writes", () => {
  it("logs through the validated slug RPC without client-controlled row fields", async () => {
    mocks.rpc.mockResolvedValue({ error: null });
    await logCallEvent("share-slug", "ended", 12);
    expect(mocks.rpc).toHaveBeenCalledWith("log_public_call_event", {
      call_slug: "share-slug", event_name: "ended", duration: 12,
    });
  });

  it("uses the server's null default for non-ended events", async () => {
    mocks.rpc.mockResolvedValue({ error: null });
    await logCallEvent("share-slug", "opened");
    expect(mocks.rpc).toHaveBeenCalledWith("log_public_call_event", {
      call_slug: "share-slug", event_name: "opened",
    });
  });

  it("does not upload without a verified user", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(uploadMedia("photos", new Blob(), "jpg")).rejects.toThrow("Entre na sua conta");
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it("uploads only beneath the verified user's folder and preserves signed links", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "owner-id" } }, error: null });
    mocks.upload.mockResolvedValue({ error: null });
    mocks.signed.mockResolvedValue({ data: { signedUrl: "https://example.org/signed" }, error: null });
    expect(await uploadMedia("photos", new Blob(), "jpg")).toBe("https://example.org/signed");
    const path = mocks.upload.mock.calls[0]?.[0];
    expect(path).toMatch(/^owner-id\//);
    expect(mocks.signed).toHaveBeenCalledWith(path, 60 * 60 * 24 * 365 * 10);
  });
});