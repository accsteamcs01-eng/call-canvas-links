import { useCallback, useEffect, useRef, useState } from "react";
import type { IosChromePlayback } from "@/lib/iosChromeFix";

/** Same state/handlers as the Telegram ActiveCall, reused by the new themes' visuals. */
export function useActiveCall(opts: {
  stream: MediaStream | null;
  showUnmuteButton: boolean;
  onFlipCamera: (facing: "user" | "environment") => Promise<MediaStream | null>;
  onEnd: (seconds: number) => void;
  iosPlayback?: IosChromePlayback | null;
  iosMutedFallback?: boolean;
}) {
  const { onFlipCamera, onEnd, iosPlayback, iosMutedFallback, showUnmuteButton } = opts;
  const [seconds, setSeconds] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [needsUnmute, setNeedsUnmute] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [stream, setStream] = useState<MediaStream | null>(opts.stream);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const secondsRef = useRef(0);
  const ended = useRef(false);

  useEffect(() => {
    if (!iosPlayback || !iosMutedFallback) return;
    setSpeakerOn(false);
    setNeedsUnmute(true);
  }, [iosPlayback, iosMutedFallback]);

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

  /** Reloads the source instead of leaving the lead on a dead screen. */
  const retryVideo = useCallback(() => {
    setVideoError(false);
    setBuffering(false);
    setReloadKey((k) => k + 1);
  }, []);

  const flip = async () => {
    const next = facing === "user" ? "environment" : "user";
    const s = await onFlipCamera(next);
    if (s) {
      setFacing(next);
      setStream(s);
    }
  };

  const unmute = () => {
    setSpeakerOn(true);
    setNeedsUnmute(false);
    if (iosPlayback?.main) {
      iosPlayback.main.muted = false;
      iosPlayback.retry();
    }
  };

  return {
    seconds, controlsVisible, bumpControls, cameraOn, micOn, speakerOn, needsUnmute, videoError, buffering, reloadKey, facing, stream,
    setBuffering, retryVideo,
    finish, flip, unmute,
    toggleCamera: () => setCameraOn((v) => !v),
    toggleMic: () => setMicOn((v) => !v),
    toggleSpeaker: () => { setSpeakerOn((v) => !v); setNeedsUnmute(false); },
    onAutoplayMuted: () => { setSpeakerOn(false); if (showUnmuteButton) setNeedsUnmute(true); },
    onVideoError: () => setVideoError(true),
  };
}
