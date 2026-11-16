import { useEffect, useRef } from "react";
import { embedUrl, type ParsedVideo } from "@/lib/video";
import type { IosChromePlayback } from "@/lib/iosChromeFix";
import { BUFFERING_DELAY_MS, MAX_RESUME_TRIES, RESUME_SPACING_MS, callDiag, isStalled } from "@/lib/callLoading";
import { IosChromeVideo } from "./IosChromeVideo";

interface Props {
  video: ParsedVideo;
  muted: boolean;
  onEnded: () => void;
  onAutoplayMuted: () => void;
  onError: () => void;
  onBufferingChange?: (buffering: boolean) => void;
  iosPlayback?: IosChromePlayback | null;
}

/**
 * Watches one media element and reports buffering. The indicator is only requested after
 * BUFFERING_DELAY_MS so brief stalls never flicker, and a clock that stops advancing counts
 * as a stall even when the browser never fires waiting/stalled.
 */
function watchBuffering(el: HTMLMediaElement, report: (buffering: boolean) => void) {
  let buffering = false;
  let delay: ReturnType<typeof setTimeout> | null = null;
  let lastTime = el.currentTime;
  let advancedAt = Date.now();

  const set = (next: boolean) => {
    if (buffering === next) return;
    buffering = next;
    report(next);
  };
  const show = () => {
    if (delay) return;
    delay = setTimeout(() => {
      delay = null;
      set(true);
    }, BUFFERING_DELAY_MS);
  };
  const hide = () => {
    if (delay) {
      clearTimeout(delay);
      delay = null;
    }
    set(false);
  };

  const onPlaying = () => {
    hide();
    advancedAt = Date.now();
    callDiag.ready();
  };
  const onWaiting = () => {
    callDiag.waiting();
    show();
  };
  const onStalled = () => {
    callDiag.waiting();
    show();
  };
  const onTime = () => {
    if (el.currentTime === lastTime) return;
    lastTime = el.currentTime;
    advancedAt = Date.now();
    hide();
  };
  const onEnd = () => hide();

  el.addEventListener("playing", onPlaying);
  el.addEventListener("waiting", onWaiting);
  el.addEventListener("stalled", onStalled);
  el.addEventListener("timeupdate", onTime);
  el.addEventListener("ended", onEnd);
  const watchdog = setInterval(() => {
    if (isStalled(Date.now(), advancedAt, el.paused)) show();
  }, 500);

  return () => {
    clearInterval(watchdog);
    if (delay) clearTimeout(delay);
    el.removeEventListener("playing", onPlaying);
    el.removeEventListener("waiting", onWaiting);
    el.removeEventListener("stalled", onStalled);
    el.removeEventListener("timeupdate", onTime);
    el.removeEventListener("ended", onEnd);
  };
}

/** Full-screen remote "participant" video with no visible player controls. */
export function RemoteVideo({ video, muted, onEnded, onAutoplayMuted, onError, onBufferingChange, iosPlayback }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const cb = useRef({ onEnded, onAutoplayMuted, onError, onBufferingChange });
  cb.current = { onEnded, onAutoplayMuted, onError, onBufferingChange };

  // Direct video (mp4/webm/m3u8)
  useEffect(() => {
    if (video.type !== "mp4") return;
    if (iosPlayback?.main) {
      // Chrome on iOS keeps its gesture-unlocked element in charge; here it is only observed.
      const main = iosPlayback.main;
      const end = () => cb.current.onEnded();
      const error = () => {
        callDiag.error();
        cb.current.onError();
      };
      main.addEventListener("ended", end);
      main.addEventListener("error", error);
      const stopHealth = watchBuffering(main, (b) => cb.current.onBufferingChange?.(b));
      iosPlayback.retry();
      return () => {
        main.removeEventListener("ended", end);
        main.removeEventListener("error", error);
        stopHealth();
      };
    }
    const el = videoRef.current;
    if (!el) return;
    let hls: { destroy: () => void } | null = null;
    let cancelled = false;
    const timers = new Set<ReturnType<typeof setTimeout>>();

    /** Tolerates engines whose play() is not a promise (jsdom, old WebKit shims). */
    const tryPlay = (): Promise<boolean> => {
      try {
        const result = el.play() as unknown;
        if (result && typeof (result as Promise<void>).catch === "function") {
          return (result as Promise<void>).then(
            () => true,
            () => false,
          );
        }
        return Promise.resolve(true);
      } catch {
        return Promise.resolve(false);
      }
    };

    // The app never pauses this video, so any pause came from the browser and is recovered.
    let tries = 0;
    let tap: (() => void) | null = null;
    const disarmTap = () => {
      if (!tap) return;
      window.removeEventListener("touchend", tap, true);
      window.removeEventListener("click", tap, true);
      tap = null;
    };
    const resumeOnTap = () => {
      if (tap) return;
      tap = () => {
        disarmTap();
        if (cancelled || el.ended || !el.paused) return;
        tryPlay().then((ok) => {
          if (ok || el.muted) return;
          el.muted = true;
          cb.current.onAutoplayMuted();
          tryPlay();
        });
      };
      window.addEventListener("touchend", tap, true);
      window.addEventListener("click", tap, true);
    };
    const giveUp = () => {
      if (tries >= MAX_RESUME_TRIES) {
        resumeOnTap();
        return;
      }
      const timer = setTimeout(resume, RESUME_SPACING_MS);
      timers.add(timer);
    };
    const resume = () => {
      if (cancelled || el.ended || !el.paused) return;
      tries += 1;
      tryPlay().then((ok) => {
        if (ok) return;
        if (!el.muted) {
          el.muted = true;
          cb.current.onAutoplayMuted();
          tryPlay().then((mutedOk) => {
            if (!mutedOk) giveUp();
          });
          return;
        }
        giveUp();
      });
    };
    const onPause = () => {
      if (cancelled || el.ended) return;
      tries = 0;
      resume();
    };
    const resetTries = () => {
      tries = 0;
    };

    el.addEventListener("pause", onPause);
    el.addEventListener("playing", resetTries);
    const stopHealth = watchBuffering(el, (b) => cb.current.onBufferingChange?.(b));

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
        h.on(Hls.Events.ERROR, (_e, data) => {
          if (!data.fatal) return;
          callDiag.error();
          cb.current.onError();
        });
      });
    } else {
      el.src = video.url;
      play();
    }
    return () => {
      cancelled = true;
      stopHealth();
      timers.forEach(clearTimeout);
      timers.clear();
      el.removeEventListener("pause", onPause);
      el.removeEventListener("playing", resetTries);
      disarmTap();
      hls?.destroy();
    };
  }, [video, iosPlayback]);

  useEffect(() => {
    if (video.type === "mp4" && videoRef.current) videoRef.current.muted = muted;
    if (iosPlayback?.main) iosPlayback.main.muted = muted;
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    if (video.type === "youtube") {
      win.postMessage(JSON.stringify({ event: "command", func: muted ? "mute" : "unMute", args: [] }), "*");
    } else if (video.type === "vimeo") {
      win.postMessage(JSON.stringify({ method: "setVolume", value: muted ? 0 : 1 }), "*");
    }
  }, [muted, video.type, iosPlayback]);

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
    if (iosPlayback?.main) return <IosChromeVideo video={iosPlayback.main} className="absolute inset-0 h-full w-full" />;
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
