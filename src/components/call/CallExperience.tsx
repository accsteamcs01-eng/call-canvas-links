import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatDuration, logCallEvent, type PublicCall } from "@/lib/calls";
import { Ringer } from "@/lib/ringtone";
import { fromStored, type VideoType } from "@/lib/video";
import { useIosChromeFix } from "@/lib/iosChromeFix";
import { callDiag, shouldLeaveConnecting } from "@/lib/callLoading";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { THEMES, resolveTheme } from "@/themes";
import { ThemedActive, ThemedConnecting, ThemedEnded, ThemedIncoming } from "@/themes/ThemedScreens";

type State = "incoming" | "declined" | "connecting" | "active" | "ended" | "closed";

/** How long the "Conectando..." screen takes to fade out once the video is ready. */
const FADE_MS = 450;
/** Readiness is polled, never assumed, so a stalled download can never hang the screen. */
const POLL_MS = 120;

export function CallExperience({ call, track = true }: { call: PublicCall; track?: boolean }) {
  const [state, setState] = useState<State>("incoming");
  const [duration, setDuration] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [fading, setFading] = useState(false);
  const ringer = useRef<Ringer | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readyRef = useRef(false);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const video = useMemo(() => fromStored(call.video_url, call.video_type as VideoType), [call]);
  const iosFix = useIosChromeFix(rootRef, video, state === "active");
  const theme = resolveTheme(call.theme);
  const t = THEMES[theme];
  /** Only a progressive mp4 can be warmed up without touching the element that will play it. */
  const canWarm = video.type === "mp4" && !video.isHls && !iosFix.playback;

  const markReady = useCallback(() => {
    readyRef.current = true;
  }, []);

  // A different source means the previous readiness no longer counts.
  useEffect(() => {
    readyRef.current = false;
  }, [video.url]);

  // Chrome on iOS keeps its own element: observing it read-only says when it is buffered.
  useEffect(() => {
    const main = iosFix.playback?.main;
    if (!main) return;
    if (main.readyState >= 3) markReady();
    const onReady = () => markReady();
    main.addEventListener("canplay", onReady);
    main.addEventListener("playing", onReady);
    return () => {
      main.removeEventListener("canplay", onReady);
      main.removeEventListener("playing", onReady);
    };
  }, [iosFix.playback, markReady]);

  // Sources that cannot be pre-buffered (YouTube, Vimeo, HLS) only need the minimum wait.
  useEffect(() => {
    if (iosFix.playback) {
      if (!iosFix.playback.main) markReady();
      return;
    }
    if (!canWarm) markReady();
  }, [canWarm, iosFix.playback, markReady]);

  const log = useCallback(
    (e: "opened" | "answered" | "declined" | "ended", d?: number) => {
      if (track) logCallEvent(call.slug, e, d).catch(() => {});
    },
    [call.slug, track],
  );

  // Preload images
  useEffect(() => {
    [call.person_photo_url, call.background_url].forEach((u) => {
      if (u) new Image().src = u;
    });
    log("opened");
  }, [call, log]);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
  };

  // Ringtone: start on incoming, retry on first user gesture if autoplay is blocked.
  useEffect(() => {
    if (state !== "incoming") return;
    const r = new Ringer(call.ringtone_type as "preset" | "custom", call.ringtone_value, call.vibrate);
    ringer.current = r;
    let unlocked = false;
    const unlock = () => {
      if (unlocked) return;
      r.start().then((ok) => {
        if (ok) {
          unlocked = true;
          remove();
        }
      });
    };
    const events = ["pointerdown", "touchstart", "keydown", "click"] as const;
    const remove = () => events.forEach((ev) => window.removeEventListener(ev, unlock, true));
    r.start().then((ok) => {
      if (!ok) events.forEach((ev) => window.addEventListener(ev, unlock, true));
      else unlocked = true;
    });
    return () => {
      remove();
      r.stop();
    };
  }, [state, call]);

  useEffect(() => () => stopStream(), []);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      timers.current.clear();
    },
    [],
  );

  const getCamera = async (facing: "user" | "environment") => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing }, audio: false });
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = s;
      setStream(s);
      iosFix.playback?.cameraReady(s);
      return s;
    } catch (error) {
      iosFix.playback?.record("getUserMedia", error);
      iosFix.playback?.cameraReady(null);
      return null;
    }
  };

  /** Leaves the connecting screen as soon as the video is really ready, within the min/max budget. */
  const waitUntilReady = (startedAt: number) =>
    new Promise<void>((resolve) => {
      const tick = () => {
        if (shouldLeaveConnecting(Date.now() - startedAt, readyRef.current)) {
          resolve();
          return;
        }
        const timer = setTimeout(tick, POLL_MS);
        timers.current.add(timer);
      };
      tick();
    });

  const accept = async () => {
    iosFix.playback?.prepare();
    ringer.current?.stop();
    log("answered");
    callDiag.start();
    if (call.fullscreen_video && rootRef.current?.requestFullscreen) {
      rootRef.current.requestFullscreen().catch(() => {});
    }
    setState("connecting");
    const started = Date.now();
    await getCamera("user");
    await waitUntilReady(started);
    setState("active");
    setFading(true);
    const timer = setTimeout(() => setFading(false), FADE_MS);
    timers.current.add(timer);
  };

  const decline = () => {
    ringer.current?.stop();
    log("declined");
    setState("declined");
  };

  const end = (secs: number) => {
    iosFix.playback?.stop();
    stopStream();
    setDuration(secs);
    log("ended", secs);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setState("ended");
  };

  const common = { name: call.person_name, photo: call.person_photo_url, background: call.background_url };

  return (
    <div ref={rootRef} className="call-root relative h-full w-full overflow-hidden bg-call-black">
      {canWarm && (state === "incoming" || state === "connecting") && (
        <video
          src={video.url}
          preload="auto"
          muted
          playsInline
          className="hidden"
          aria-hidden
          data-testid="warm-video"
          onLoadedData={markReady}
          onCanPlay={markReady}
          onProgress={(e) => {
            if (e.currentTarget.readyState >= 3) markReady();
          }}
          onError={markReady}
        />
      )}

      {state === "incoming" && (
        <ThemedIncoming theme={theme} {...common} subtitle={call.subtitle || "Chamada de vídeo"} onAccept={accept} onDecline={decline} />
      )}

      {state === "declined" && (
        <ThemedEnded
          theme={theme}
          {...common}
          title={t.texts.declined}
          actionLabel={t.texts.callBack}
          variant="callback"
          onAction={() => setState("incoming")}
        />
      )}

      {(state === "connecting" || (state === "active" && fading)) && (
        <div
          className={`absolute inset-0 z-40 transition-opacity duration-[450ms] ${fading ? "pointer-events-none opacity-0" : "opacity-100"}`}
        >
          <ThemedConnecting theme={theme} {...common} />
        </div>
      )}

      {state === "active" && (
        <ThemedActive
          theme={theme}
          {...common}
          video={video}
          stream={stream}
          showUnmuteButton={call.unmute_button}
          iosPlayback={iosFix.playback}
          iosMutedFallback={iosFix.mutedFallback}
          onFlipCamera={getCamera}
          onEnd={end}
        />
      )}

      {state === "ended" && (
        <ThemedEnded
          theme={theme}
          {...common}
          title={t.texts.ended}
          detail={formatDuration(duration)}
          actionLabel={t.texts.close}
          onAction={() => {
            window.close();
            setState("closed");
          }}
        />
      )}

      {state === "closed" && <div className="absolute inset-0 bg-call-black" />}
      {state === "active" && iosFix.needsStart && (
        <Button type="button" variant="ghost" aria-label="Iniciar vídeo" onClick={() => iosFix.playback?.retry()}
          className="absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-full bg-call-panel text-call-ink backdrop-blur-xl">
          <Play /> Iniciar vídeo
        </Button>
      )}
      {iosFix.debug && (
        <div className="pointer-events-none absolute bottom-2 left-2 z-50 whitespace-pre-line bg-call-panel p-2 text-[10px] text-call-ink">
          {iosFix.diagnostics.join("\n")}
        </div>
      )}
    </div>
  );
}
