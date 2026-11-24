import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getUser: vi.fn(),
  list: vi.fn(),
  sign: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getSession: mocks.getSession, getUser: mocks.getUser },
    storage: { from: mocks.from },
  },
}));

import { libraryQueryOptions } from "./library";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getSession.mockResolvedValue({ data: { session: { user: { id: "owner-test" } } }, error: null });
  mocks.from.mockReturnValue({ list: mocks.list, createSignedUrls: mocks.sign });
  mocks.list.mockResolvedValue({ data: [], error: null });
});

describe("library loading", () => {
  it("reads all private folders without an extra remote user request", async () => {
    const client = new QueryClient();
    await client.fetchQuery(libraryQueryOptions);
    expect(mocks.getSession).toHaveBeenCalledTimes(1);
    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(mocks.from.mock.calls.map((call) => call[0])).toEqual(["photos", "backgrounds", "videos", "ringtones"]);
    expect(mocks.list).toHaveBeenCalledTimes(4);
    for (const call of mocks.list.mock.calls) expect(call[0]).toBe("owner-test");
    client.clear();
  });

  it("makes no storage request without a signed-in owner", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
    const client = new QueryClient();
    expect(await client.fetchQuery(libraryQueryOptions)).toEqual([]);
    expect(mocks.from).not.toHaveBeenCalled();
    client.clear();
  });
});