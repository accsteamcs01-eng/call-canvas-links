import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

describe("admin navigation cache", () => {
  it("shows cached data immediately while refreshing a stale page", async () => {
    const client = new QueryClient();
    const key = ["admin-navigation-test"];
    client.setQueryData(key, { count: 2 }, { updatedAt: 1 });
    let complete: ((data: { count: number }) => void) | undefined;
    const queryFn = () => new Promise<{ count: number }>((resolve) => { complete = resolve; });
    const result = await client.ensureQueryData({ queryKey: key, queryFn, staleTime: 60_000, revalidateIfStale: true });
    expect(result).toEqual({ count: 2 });
    expect(client.isFetching({ queryKey: key })).toBe(1);
    if (!complete) throw new Error("Background refresh did not start");
    complete({ count: 3 });
    await client.fetchQuery({ queryKey: key, queryFn });
    expect(client.getQueryData(key)).toEqual({ count: 3 });
    client.clear();
  });

  it("shares one request between route preloading and opening the page", async () => {
    const client = new QueryClient();
    let reads = 0;
    const options = {
      queryKey: ["admin-shared-request"],
      staleTime: 60_000,
      queryFn: async () => { reads += 1; return ["saved-call"]; },
    };
    const [preloaded, opened] = await Promise.all([client.ensureQueryData(options), client.ensureQueryData(options)]);
    expect(reads).toBe(1);
    expect(preloaded).toEqual(opened);
    await client.invalidateQueries({ queryKey: options.queryKey });
    await client.ensureQueryData({ ...options, revalidateIfStale: true });
    await client.fetchQuery(options);
    expect(reads).toBe(2);
    client.clear();
  });
});