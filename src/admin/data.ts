import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Call } from "@/lib/calls";
import type { EventRow } from "./metrics";

export function useCallsData() {
  return useQuery({
    queryKey: ["calls"],
    queryFn: async () => {
      const { data: calls, error } = await supabase.from("calls").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      const ids = calls.map((c) => c.id);
      const { data: ev, error: e2 } = ids.length
        ? await supabase.from("call_events").select("call_id,event,duration_seconds,created_at").in("call_id", ids).order("created_at", { ascending: false }).limit(10000)
        : { data: [] as EventRow[], error: null };
      if (e2) throw e2;
      return { calls: calls as Call[], events: (ev ?? []) as EventRow[] };
    },
  });
}

export function useUserEmail() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => (await supabase.auth.getUser()).data.user?.email ?? "",
    staleTime: Infinity,
  });
}
