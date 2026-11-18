import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Contact = Database["public"]["Tables"]["contacts"]["Row"];

export function contactFields(contact: Pick<Contact, "id" | "name" | "photo_url" | "subtitle">) {
  return {
    contact_id: contact.id,
    person_name: contact.name,
    person_photo_url: contact.photo_url,
    subtitle: contact.subtitle,
  };
}

export function contactUsage(calls: { contact_id: string | null }[]) {
  const counts: Record<string, number> = {};
  for (const call of calls) {
    if (call.contact_id) counts[call.contact_id] = (counts[call.contact_id] ?? 0) + 1;
  }
  return counts;
}

export const contactsQueryOptions = queryOptions({
  queryKey: ["contacts"],
  queryFn: async () => {
    const { data, error } = await supabase.from("contacts").select("*").order("name");
    if (error) throw error;
    return data;
  },
});

export const contactUsageQueryOptions = queryOptions({
  queryKey: ["contact-usage"],
  queryFn: async () => {
    const { data, error } = await supabase.from("calls").select("contact_id");
    if (error) throw error;
    return contactUsage(data);
  },
});
