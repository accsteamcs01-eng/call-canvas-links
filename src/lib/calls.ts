import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Call = Database["public"]["Tables"]["calls"]["Row"];
export type CallInsert = Database["public"]["Tables"]["calls"]["Insert"];
export type CallEventType = "opened" | "answered" | "declined" | "ended";

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
export function randomSlug(len = 6) {
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => ALPHABET[n % ALPHABET.length]).join("");
}

export type Bucket = "photos" | "backgrounds" | "ringtones" | "videos";

/** Uploads to a private bucket and returns a long-lived signed URL usable by anyone with the link. */
export async function uploadMedia(bucket: Bucket, file: Blob, ext: string): Promise<string> {
  const { data: u } = await supabase.auth.getUser();
  const path = `${u.user?.id ?? "anon"}/${Date.now()}-${randomSlug(8)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw error;
  const { data, error: e2 } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (e2 || !data) throw e2 ?? new Error("Falha ao gerar link do arquivo");
  return data.signedUrl;
}

export async function logCallEvent(callId: string, event: CallEventType, duration?: number) {
  await supabase.from("call_events").insert({ call_id: callId, event, duration_seconds: duration ?? null });
}

export function formatDuration(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export interface CallStats {
  opened: number;
  answered: number;
  declined: number;
  avgDuration: number;
}

export function aggregateStats(
  events: { call_id: string; event: string; duration_seconds: number | null }[],
): Record<string, CallStats> {
  const out: Record<string, CallStats & { _sum: number; _n: number }> = {};
  for (const e of events) {
    const s = (out[e.call_id] ??= { opened: 0, answered: 0, declined: 0, avgDuration: 0, _sum: 0, _n: 0 });
    if (e.event === "opened") s.opened++;
    else if (e.event === "answered") s.answered++;
    else if (e.event === "declined") s.declined++;
    else if (e.event === "ended" && e.duration_seconds != null) {
      s._sum += e.duration_seconds;
      s._n++;
    }
  }
  const res: Record<string, CallStats> = {};
  for (const [k, v] of Object.entries(out)) {
    res[k] = { opened: v.opened, answered: v.answered, declined: v.declined, avgDuration: v._n ? v._sum / v._n : 0 };
  }
  return res;
}
