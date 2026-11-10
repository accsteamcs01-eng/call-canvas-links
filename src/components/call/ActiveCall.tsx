import { useCallback, useEffect, useRef, useState } from "react";
import { formatDuration } from "@/lib/calls";
import type { ParsedVideo } from "@/lib/video";
import { CallControls } from "./CallControls";
import { LockIcon, SpeakerIcon } from "./CallIcons";
import { RemoteVideo } from "./RemoteVideo";
import { SelfView } from "./SelfView";
import { Avatar, CallBackdrop } from "./CallBackdrop";

interface Props {
  name: string;
  photo?: string | null;
  background?: string | null;
  video: ParsedVideo;
  stream: MediaStream | null;
  showUnmuteButton: boolean;
  onFlipCamera: (facing: "user" | "environment") => Promise<MediaStream | null>;
  onEnd: (seconds: number) => void;
}

const EMOJIS = ["🐼", "🎈", "🍀", "🚀"];

export function ActiveCall({ name, photo, background, video, stream: initialStream, showUnmuteButton, onFlipCamera, onEnd }: Props) {
  const [seconds, setSeconds] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [needsUnmute, setNeedsUnmute] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [stream, setStream] = useState<MediaStream | null>(initialStream);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const secondsRef = useRef(0);
  const ended = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => (secondsRef.current = s + 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const bumpControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 4000);
  }, []);

  useEffect(() => {
    bumpControls();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [bumpControls]);

  useEffect(() => {
    stream?.getVideoTracks().forEach((t) => (t.enabled = cameraOn));
  }, [cameraOn, stream]);

  const finish = useCallback(() => {
    if (ended.current) return;
    ended.current = true;
    onEnd(secondsRef.current);
  }, [onEnd]);

  const flip = async () => {
    const next = facing === "user" ? "environment" : "user";
    const s = await onFlipCamera(next);
    if (s) {
      setFacing(next);
      setStream(s);
    }
  };

  return (
    <div className="absolute inset-0 bg-call-black animate-call-fade" onPointerDown={bumpControls}>
      {videoError ? (
        <>
          <CallBackdrop src={background ?? photo} dark />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Avatar src={photo} name={name} size={120} />
            <p className="mt-5 text-[15px] text-call-ink/70">Conexão instável…</p>
          </div>
        </>
      ) : (
        <RemoteVideo
          video={video}
          muted={!speakerOn}
          onEnded={finish}
          onAutoplayMuted={() => {
            setSpeakerOn(false);
            if (showUnmuteButton) setNeedsUnmute(true);
          }}
          onError={() => setVideoError(true)}
        />
      )}

      {/* Top bar */}
      <div
        className={`absolute inset-x-0 top-0 z-30 bg-gradient-to-b from-call-black/60 to-transparent px-4 pb-8 pt-[calc(env(safe-area-inset-top)+12px)] transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-call-accept opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-call-accept" />
              </span>
              <h2 className="truncate text-[17px] font-semibold">{name}</h2>
            </div>
            <p className="mt-0.5 pl-4 text-[13px] tabular-nums text-call-ink/75">{formatDuration(seconds)}</p>
          </div>
          <div className="mr-[120px] flex items-center gap-1 rounded-full bg-call-glass px-2.5 py-1 text-[13px] backdrop-blur-md">
            <LockIcon className="h-3 w-3 opacity-80" />
            <span className="tracking-wider">{EMOJIS.join("")}</span>
          </div>
        </div>
      </div>

      <SelfView stream={stream} cameraOn={cameraOn} mirrored={facing === "user"} bottomInset={controlsVisible ? 120 : 20} />

      {needsUnmute && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSpeakerOn(true);
            setNeedsUnmute(false);
          }}
          className="absolute left-1/2 top-1/2 z-40 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-call-panel px-5 py-3 text-[15px] font-medium backdrop-blur-xl transition-transform active:scale-95"
        >
          <SpeakerIcon className="h-5 w-5" />
          Toque para ativar o som
        </button>
      )}

      <CallControls
        visible={controlsVisible}
        cameraOn={cameraOn && !!stream}
        micOn={micOn}
        speakerOn={speakerOn}
        onToggleCamera={() => setCameraOn((v) => !v)}
        onFlip={flip}
        onToggleMic={() => setMicOn((v) => !v)}
        onToggleSpeaker={() => {
          setSpeakerOn((v) => !v);
          setNeedsUnmute(false);
        }}
        onEnd={finish}
      />
    </div>
  );
}
