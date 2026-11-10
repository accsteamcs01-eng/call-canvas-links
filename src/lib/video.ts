export type VideoType = "mp4" | "youtube" | "vimeo" | "iframe";

export interface ParsedVideo {
  type: VideoType;
  url: string;
  /** For youtube/vimeo: the provider id */
  id?: string;
  isHls?: boolean;
}

/** Accepts a direct link, YouTube/Vimeo link or pasted iframe code and detects its type. */
export function parseVideoInput(raw: string): ParsedVideo | null {
  let input = raw.trim();
  if (!input) return null;

  const iframeMatch = input.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
  if (iframeMatch) input = iframeMatch[1];
  if (input.startsWith("//")) input = "https:" + input;

  let u: URL;
  try {
    u = new URL(input);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\.|^m\./, "");

  if (host === "youtu.be" || host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
    let id = "";
    if (host === "youtu.be") id = u.pathname.slice(1);
    else if (u.pathname.startsWith("/watch")) id = u.searchParams.get("v") ?? "";
    else {
      const m = u.pathname.match(/\/(embed|shorts|live|v)\/([^/?]+)/);
      if (m) id = m[2];
    }
    id = id.split(/[?&/]/)[0];
    if (id) return { type: "youtube", id, url: `https://www.youtube.com/watch?v=${id}` };
  }

  if (host.endsWith("vimeo.com")) {
    const m = u.pathname.match(/(\d{5,})/);
    if (m) return { type: "vimeo", id: m[1], url: `https://vimeo.com/${m[1]}` };
  }

  const path = u.pathname.toLowerCase();
  if (/\.(mp4|webm|mov|m4v|ogg|m3u8)$/.test(path) || u.hostname.includes("supabase")) {
    return { type: "mp4", url: u.toString(), isHls: path.endsWith(".m3u8") };
  }

  if (iframeMatch) return { type: "iframe", url: u.toString() };
  // Unknown page — treat as embeddable iframe
  return { type: "iframe", url: u.toString() };
}

export function fromStored(url: string, type: VideoType): ParsedVideo {
  const parsed = parseVideoInput(url);
  if (parsed && parsed.type === type) return parsed;
  return { type, url, isHls: url.toLowerCase().split("?")[0].endsWith(".m3u8") };
}

export function embedUrl(v: ParsedVideo, opts: { muted?: boolean; controls?: boolean } = {}): string {
  const mute = opts.muted ? 1 : 0;
  const controls = opts.controls ? 1 : 0;
  if (v.type === "youtube") {
    const origin = typeof window !== "undefined" ? `&origin=${encodeURIComponent(window.location.origin)}` : "";
    return `https://www.youtube.com/embed/${v.id}?autoplay=1&mute=${mute}&controls=${controls}&playsinline=1&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&fs=0&enablejsapi=1${origin}`;
  }
  if (v.type === "vimeo") {
    return `https://player.vimeo.com/video/${v.id}?autoplay=1&muted=${mute}&controls=${controls}&playsinline=1&title=0&byline=0&portrait=0&dnt=1`;
  }
  return v.url;
}
