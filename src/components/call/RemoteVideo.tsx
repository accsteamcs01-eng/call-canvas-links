import { useEffect, useRef } from "react";
import { embedUrl, type ParsedVideo } from "@/lib/video";

interface Props {
  video: ParsedVideo;
  muted: boolean;
  onEnded: () => void;
  onAutoplayMuted: () => void;
  onError: () => void;
}

/** Full-screen remote "participant" video with no visible player controls. */
export function RemoteVideo({ video, muted, onEnded, onAutoplayMuted, onError }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const cb = useRef({ onEnded, onAutoplayMuted, onError });
  cb.current = { onEnded, onAutoplayMuted, onError };

  // Direct video (mp4/webm/m3u8)
  useEffect(() => {
    if (video.type !== "mp4") return;
    const el = videoRef.current;
    if (!el) return;
    let hls: { destroy: () => void } | null = null;
    let cancelled = false;

    const play = async () => {
      try {
        el.muted = false;
        await el.play();
      } catch {
        el.muted = true;
        try {
          await el.play();
          cb.current.onAutoplayMuted();
        } catch {
          /* ignore */
        }
      }
    };

    if (video.isHls && !el.canPlayType("application/vnd.apple.mpegurl")) {
      import("hls.js").then(({ default: Hls }) => {
        if (cancelled) return;
        if (!Hls.isSupported()) return cb.current.onError();
        const h = new Hls();
        hls = h;
        h.loadSource(video.url);
        h.attachMedia(el);
        h.on(Hls.Events.MANIFEST_PARSED, play);
        h.on(Hls.Events.ERROR, (_e, data) => data.fatal && cb.current.onError());
      });
    } else {
      el.src = video.url;
      play();
    }
    return () => {
      cancelled = true;
      hls?.destroy();
    };
  }, [video]);

  useEffect(() => {
    if (video.type === "mp4" && videoRef.current) videoRef.current.muted = muted;
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    if (video.type === "youtube") {
      win.postMessage(JSON.stringify({ event: "command", func: muted ? "mute" : "unMute", args: [] }), "*");
    } else if (video.type === "vimeo") {
      win.postMessage(JSON.stringify({ method: "setVolume", value: muted ? 0 : 1 }), "*");
    }
  }, [muted, video.type]);

  // Detect end of embedded players
  useEffect(() => {
    if (video.type !== "youtube" && video.type !== "vimeo") return;
    const onMsg = (e: MessageEvent) => {
      let data: unknown = e.data;
      if (typeof data === "string") {
        try { data = JSON.parse(data); } catch { return; }
      }
      const d = data as { event?: string; info?: { playerState?: number }; method?: string };
      if (video.type === "youtube" && e.origin.includes("youtube")) {
        if ((d.event === "onStateChange" && (d.info as unknown) === 0) || d.info?.playerState === 0) cb.current.onEnded();
      }
      if (video.type === "vimeo" && e.origin.includes("vimeo")) {
        if (d.event === "ready") {
          iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ method: "addEventListener", value: "ended" }), "*");
        }
        if (d.event === "ended") cb.current.onEnded();
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [video.type]);

  const onIframeLoad = () => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    if (video.type === "youtube") {
      win.postMessage(JSON.stringify({ event: "listening", id: "callsim" }), "*");
      win.postMessage(JSON.stringify({ event: "command", func: "addEventListener", args: ["onStateChange"] }), "*");
    }
    if (video.type === "vimeo") {
      win.postMessage(JSON.stringify({ method: "addEventListener", value: "ended" }), "*");
    }
  };

  if (video.type === "mp4") {
    return (
      <video
        ref={videoRef}
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover"
        onEnded={() => cb.current.onEnded()}
        onError={() => cb.current.onError()}
        disablePictureInPicture
        controls={false}
      />
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Oversize the iframe so it covers the screen like object-cover */}
      <iframe
        ref={iframeRef}
        src={embedUrl(video)}
        title="video"
        onLoad={onIframeLoad}
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        className="absolute left-1/2 top-1/2 h-full w-[316%] min-w-full -translate-x-1/2 -translate-y-1/2 border-0 sm:w-[316%]"
        style={{ aspectRatio: "auto" }}
      />
    </div>
  );
}
