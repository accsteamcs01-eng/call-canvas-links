import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({
  row: null as { id: string; is_active: boolean } | null,
  filters: [] as Array<[string, unknown]>,
  preview: undefined as number | undefined,
  experience: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, any>) => ({
    options,
    useParams: () => ({ slug: "test-call" }),
    useSearch: () => ({ preview: mock.preview }),
  }),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => {
      const filters: Array<[string, unknown]> = [];
      const query = {
        select: () => query,
        eq: (key: string, value: unknown) => {
          filters.push([key, value]);
          mock.filters.push([key, value]);
          return query;
        },
        maybeSingle: async () => ({
          data: filters.some(([key, value]) => key === "is_active" && value === true)
            && mock.row?.is_active !== true ? null : mock.row,
          error: null,
        }),
      };
      return query;
    },
  },
}));
vi.mock("@/components/call/CallExperience", () => ({
  CallExperience: (props: unknown) => { mock.experience(props); return null; },
}));

import { Route } from "@/routes/c.$slug";

afterEach(() => {
  cleanup();
  mock.filters = [];
  mock.preview = undefined;
  mock.experience.mockClear();
});

function openCall(cached = false) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  if (cached) client.setQueryData(["call", "test-call"], { id: "test-id", is_active: true });
  const Page = Route.options.component;
  if (!Page) throw new Error("Missing call page");
  render(<QueryClientProvider client={client}><Page /></QueryClientProvider>);
  return client;
}

describe("Public call availability", () => {
  it("does not expose inactive call share fields", async () => {
    mock.row = { id: "test-id", is_active: false };
    const loader = Route.options.loader as (input: { params: { slug: string } }) => Promise<{ share: unknown }>;
    const result = await loader({ params: { slug: "test-call" } });
    expect(result.share).toBeNull();
    expect(mock.filters).toContainEqual(["is_active", true]);
  });

  it("blocks inactive playback even with preview=1 and a cached active row", async () => {
    mock.row = { id: "test-id", is_active: false };
    mock.preview = 1;
    const client = openCall(true);
    await waitFor(() => expect(client.getQueryData(["call", "test-call"])).toBeNull());
    expect(mock.experience).not.toHaveBeenCalled();
    client.clear();
  });

  it("allows playback again when is_active becomes true", async () => {
    mock.row = { id: "test-id", is_active: true };
    const client = openCall();
    await waitFor(() => expect(mock.experience).toHaveBeenCalledWith({ call: mock.row, track: true }));
    expect(mock.filters).toContainEqual(["is_active", true]);
    client.clear();
  });
});