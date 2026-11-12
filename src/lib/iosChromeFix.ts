import { useEffect, useRef, useState, type RefObject } from "react";
import type { ParsedVideo } from "./video";

export function isIosChrome(userAgent: string): boolean {
  return /CriOS/i.test(userAgent) && /iPhone|iPad|iPod/i.test(userAgent);
}

export interface IosChromePlayback {
  main: HTMLVideoElement | null;
  self: HTMLVideoElement;
  prepare: () => void;
  cameraReady: (stream: MediaStream | null) => void;
  retry: () => void;
  stop: () => void;
  record: (source: string, error: unknown) => void;
}

/** Owns the same video elements before and after the permission prompt. */
export function createIosChromePlayback(
  video: ParsedVideo,
  notifyMuted: () => void,
  record: (source: string, error: unknown) => void,
): IosChromePlayback & { dispose: () => void } {
  const makeVideo = () => {
    const el = document.createElement("video");
    el.playsInline = true;
    el.setAttribute("webkit-playsinline", "");
    el.preload = "auto";
    el.controls = false;
    return el;
  };
  const main = video.type === "mp4" ? makeVideo() : null;
  if (main) {
    main.src = video.url;
    main.disablePictureInPicture = true;
  }
  const self = makeVideo();
  self.muted = true;
  self.autoplay = true;
  let disposed = false;
  let started = false;
  let gestureArmed = false;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const removeGesture = () => {
    window.removeEventListener("touchend", nextGesture, true);
    window.removeEventListener("click", nextGesture, true);
    gestureArmed = false;
  };
  const armGesture = () => {
    if (disposed || gestureArmed) return;
    gestureArmed = true;
    window.addEventListener("touchend", nextGesture, true);
    window.addEventListener("click", nextGesture, true);
  };
  const rejected = (label: string, error: unknown) => {
    if (disposed) return;
    record(label, error);
    if (typeof error === "object" && error !== null && "name" in error && error.name === "NotAllowedError") armGesture();
  };
  const play = (el: HTMLVideoElement, label: string, fallback = false) => {
    if (disposed) return;
    try {
      // Deliberately called synchronously, not after a permission promise.
      const result = el.play();
      result?.catch((error: unknown) => {
        rejected(label, error);
        if (fallback && !disposed && !el.muted) {
          el.muted = true;
          notifyMuted();
          play(el, label);
        }
      });
    } catch (error) {
      rejected(label, error);
      if (fallback && !el.muted) {
        el.muted = true;
        notifyMuted();
        play(el, label);
      }
    }
  };
  const retry = () => {
    if (!started || disposed) return;
    if (main?.paused) {
      if (main.readyState === 0 && main.networkState !== HTMLMediaElement.NETWORK_LOADING) main.load();
      play(main, "main", true);
    }
    if (self.paused && self.srcObject) play(self, "self");
  };
  function nextGesture() {
    removeGesture();
    retry();
  }
  const metadata = () => play(self, "self");
  self.addEventListener("loadedmetadata", metadata);
  const visible = () => { if (document.visibilityState !== "hidden") retry(); };
  document.addEventListener("visibilitychange", visible);
  window.addEventListener("pageshow", retry);
  return {
    main, self, retry, record,
    stop: () => {
      started = false;
      removeGesture();
      timers.forEach(clearTimeout);
      timers.clear();
      main?.pause();
      self.pause();
    },
    prepare: () => {
      started = true;
      if (main) play(main, "main", true);
      play(self, "self");
    },
    cameraReady: (stream) => {
      if (disposed) return;
      self.srcObject = stream;
      self.muted = true;
      self.playsInline = true;
      self.autoplay = true;
      retry();
      for (const delay of [300, 800, 1500]) {
        const timer = setTimeout(() => { timers.delete(timer); retry(); }, delay);
        timers.add(timer);
      }
    },
    dispose: () => {
      disposed = true;
      timers.forEach(clearTimeout);
      removeGesture();
      self.removeEventListener("loadedmetadata", metadata);
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("pageshow", retry);
      [main, self].forEach((el) => { if (el) { el.pause(); el.srcObject = null; el.removeAttribute("src"); el.load(); el.remove(); } });
    },
  };
}

export function useIosChromeFix(root: RefObject<HTMLDivElement | null>, video: ParsedVideo, active: boolean) {
  const playback = useRef<IosChromePlayback | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [mutedFallback, setMutedFallback] = useState(false);
  const [needsStart, setNeedsStart] = useState(false);
  const [debug, setDebug] = useState(false);
  const [diagnostics, setDiagnostics] = useState<string[]>([]);
  useEffect(() => {
    if (!isIosChrome(navigator.userAgent)) return;
    setEnabled(true);
    const debugEnabled = new URLSearchParams(window.location.search).get("debug") === "1";
    setDebug(debugEnabled);
    document.documentElement.classList.add("ios-chrome-call-fix");
    const record = (source: string, error: unknown) => {
      const name = typeof error === "object" && error !== null && "name" in error ? String(error.name) : "UnknownError";
      console.warn(`[iOS Chrome call] ${source}: ${name}`);
      if (debugEnabled) setDiagnostics((previous) => [...previous.slice(-5), `${source}: ${name}`]);
    };
    const fix = createIosChromePlayback(video, () => setMutedFallback(true), record);
    playback.current = fix;
    const staging = document.createElement("div");
    staging.className = "ios-chrome-video-staging";
    staging.setAttribute("aria-hidden", "true");
    if (fix.main) staging.append(fix.main);
    staging.append(fix.self);
    root.current?.append(staging);
    return () => {
      playback.current = null;
      fix.dispose();
      staging.remove();
      document.documentElement.classList.remove("ios-chrome-call-fix");
    };
  }, [root, video]);

  useEffect(() => {
    if (!enabled || !active) { setNeedsStart(false); return; }
    const main = playback.current?.main;
    if (!main) return; // Cross-origin iframe players cannot expose their video elements.
    const playing = () => setNeedsStart(false);
    main.addEventListener("playing", playing);
    const timer = setTimeout(() => {
      if (!main.paused && main.readyState >= 2) return;
      playback.current?.retry();
    }, 2000);
    const check = setTimeout(() => setNeedsStart(main.paused || main.readyState < 2), 2300);
    return () => { clearTimeout(timer); clearTimeout(check); main.removeEventListener("playing", playing); };
  }, [active, enabled]);

  useEffect(() => {
    if (!debug) return;
    const timer = setInterval(() => {
      const fix = playback.current;
      setDiagnostics((previous) => [
        ...previous.filter((line) => !line.startsWith("state ")),
        ...([['main', fix?.main], ['self', fix?.self]] as const).flatMap(([name, el]) => el ? [`state ${name}: paused=${el.paused} readyState=${el.readyState}`] : []),
      ]);
    }, 500);
    return () => clearInterval(timer);
  }, [debug]);
  return { playback: enabled ? playback.current : null, mutedFallback, needsStart, debug, diagnostics };
}