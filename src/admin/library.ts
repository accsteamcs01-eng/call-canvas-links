import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Bucket } from "@/lib/calls";

export const LIBRARY_BUCKETS: { id: Bucket; label: string; accept: string }[] = [
  { id: "photos", label: "Fotos", accept: "image/*" },
  { id: "backgrounds", label: "Capas", accept: "image/*" },
  { id: "videos", label: "Vídeos", accept: "video/mp4,video/webm,video/quicktime" },
  { id: "ringtones", label: "Toques", accept: "audio/*" },
];

export interface MediaItem {
  bucket: Bucket;
  path: string;
  name: string;
  size: number;
  createdAt: string;
  url: string;
}

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

/** True when a stored signed URL points at this exact bucket/path. */
export function urlMatchesFile(url: string | null | undefined, bucket: string, path: string) {
  if (!url) return false;
  const clean = url.split("?")[0] ?? "";
  return decodeURIComponent(clean).endsWith(`/${bucket}/${path}`);
}

/** Number of calls/contacts referencing each file key `${bucket}/${path}`. */
export function mediaUsage(items: Pick<MediaItem, "bucket" | "path">[], urls: (string | null)[]) {
  const out: Record<string, number> = {};
  for (const it of items) {
    out[`${it.bucket}/${it.path}`] = urls.filter((u) => urlMatchesFile(u, it.bucket, it.path)).length;
  }
  return out;
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

async function listBucket(bucket: Bucket, userId: string): Promise<MediaItem[]> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(userId, { limit: 1000, sortBy: { column: "created_at", order: "desc" } });
  if (error) throw error;
  const files = (data ?? []).filter((f) => f.id && !f.name.startsWith("."));
  if (!files.length) return [];
  const paths = files.map((f) => `${userId}/${f.name}`);
  const { data: signed, error: e2 } = await supabase.storage.from(bucket).createSignedUrls(paths, TEN_YEARS);
  if (e2) throw e2;
  return files.map((f, i) => ({
    bucket,
    path: paths[i]!,
    name: f.name,
    size: Number((f.metadata as { size?: number } | null)?.size ?? 0),
    createdAt: f.created_at ?? "",
    url: signed?.[i]?.signedUrl ?? "",
  }));
}

export const libraryQueryOptions = queryOptions({
  queryKey: ["library"],
  staleTime: 60_000,
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return [];
    const lists = await Promise.all(LIBRARY_BUCKETS.map((b) => listBucket(b.id, u.user!.id)));
    return lists.flat().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
});

export const libraryUsageQueryOptions = queryOptions({
  queryKey: ["library-usage"],
  staleTime: 60_000,
  queryFn: async () => {
    const [calls, contacts] = await Promise.all([
      supabase.from("calls").select("person_photo_url,background_url,video_url,ringtone_value,preview_image_url"),
      supabase.from("contacts").select("photo_url"),
    ]);
    if (calls.error) throw calls.error;
    if (contacts.error) throw contacts.error;
    return [
      ...calls.data.flatMap((c) => [c.person_photo_url, c.background_url, c.video_url, c.ringtone_value, c.preview_image_url]),
      ...contacts.data.map((c) => c.photo_url),
    ];
  },
});
