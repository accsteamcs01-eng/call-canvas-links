import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Call } from "@/lib/calls";
import type { EventRow } from "./metrics";

export const callsQueryOptions = queryOptions({
    queryKey: ["calls"],
    queryFn: async () => {
      // Run both in parallel; RLS already limits events to the owner's calls.
      const [c, e] = await Promise.all([
        supabase.from("calls").select("*").order("created_at", { ascending: false }),
        supabase.from("call_events").select("call_id,event,duration_seconds,created_at").order("created_at", { ascending: false }).limit(10000),
      ]);
      if (c.error) throw c.error;
      if (e.error) throw e.error;
      return { calls: c.data as Call[], events: (e.data ?? []) as EventRow[] };
    },
});

export function useCallsData(enabled = true) {
  return useQuery({ ...callsQueryOptions, enabled });
}

export function useSuspenseCallsData() {
  return useSuspenseQuery(callsQueryOptions);
}

export function useUserEmail() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => (await supabase.auth.getSession()).data.session?.user.email ?? "",
    staleTime: Infinity,
  });
}
