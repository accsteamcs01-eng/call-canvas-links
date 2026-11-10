import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatDuration, logCallEvent, type Call } from "@/lib/calls";
import { Ringer } from "@/lib/ringtone";
import { fromStored, type VideoType } from "@/lib/video";
import { ActiveCall } from "./ActiveCall";
import { Avatar, CallBackdrop } from "./CallBackdrop";
import { EndedScreen } from "./EndedScreen";
import { IncomingCall } from "./IncomingCall";

type State = "incoming" | "declined" | "connecting" | "active" | "ended" | "closed";

export function CallExperience({ call, track = true }: { call: Call; track?: boolean }) {
  const [state, setState] = useState<State>("incoming");
  const [duration, setDuration] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const ringer = useRef<Ringer | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const video = useMemo(() => fromStored(call.video_url, call.video_type as VideoType), [call]);

  const log = useCallback(
    (e: "opened" | "answered" | "declined" | "ended", d?: number) => {
      if (track) logCallEvent(call.id, e, d).catch(() => {});
    },
    [call.id, track],
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

  const getCamera = async (facing: "user" | "environment") => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing }, audio: false });
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = s;
      setStream(s);
      return s;
    } catch {
      return null;
    }
  };

  const accept = async () => {
    ringer.current?.stop();
    log("answered");
    if (call.fullscreen_video && rootRef.current?.requestFullscreen) {
      rootRef.current.requestFullscreen().catch(() => {});
    }
    setState("connecting");
    const started = Date.now();
    await getCamera("user");
    const wait = Math.max(0, 1400 - (Date.now() - started));
    setTimeout(() => setState("active"), wait);
  };

  const decline = () => {
    ringer.current?.stop();
    log("declined");
    setState("declined");
  };

  const end = (secs: number) => {
    stopStream();
    setDuration(secs);
    log("ended", secs);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setState("ended");
  };

  const common = { name: call.person_name, photo: call.person_photo_url, background: call.background_url };

  return (
    <div ref={rootRef} className="call-root relative h-full w-full overflow-hidden bg-call-black">
      {video.type === "mp4" && state === "incoming" && (
        <video src={video.url} preload="auto" muted className="hidden" aria-hidden />
      )}

      {state === "incoming" && (
        <IncomingCall {...common} subtitle={call.subtitle || "Chamada de vídeo"} onAccept={accept} onDecline={decline} />
      )}

      {state === "declined" && (
        <EndedScreen
          {...common}
          title="Chamada recusada"
          actionLabel="Ligar de volta"
          variant="callback"
          onAction={() => setState("incoming")}
        />
      )}

      {state === "connecting" && (
        <div className="absolute inset-0 animate-call-fade">
          <CallBackdrop src={common.background ?? common.photo} />
          <div className="relative flex h-full flex-col items-center justify-center">
            <Avatar src={common.photo} name={common.name} size={120} />
            <h1 className="mt-7 text-[26px] font-semibold">{common.name}</h1>
            <p className="mt-1.5 text-[16px] text-call-ink/70">Conectando...</p>
          </div>
        </div>
      )}

      {state === "active" && (
        <ActiveCall
          {...common}
          video={video}
          stream={stream}
          showUnmuteButton={call.unmute_button}
          onFlipCamera={getCamera}
          onEnd={end}
        />
      )}

      {state === "ended" && (
        <EndedScreen
          {...common}
          title="Chamada encerrada"
          detail={formatDuration(duration)}
          actionLabel="Fechar"
          onAction={() => {
            window.close();
            setState("closed");
          }}
        />
      )}

      {state === "closed" && <div className="absolute inset-0 bg-call-black" />}
    </div>
  );
}
