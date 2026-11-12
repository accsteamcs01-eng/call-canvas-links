import { useCallback } from "react";

/** Moves the gesture-unlocked element without recreating it or changing its source. */
export function IosChromeVideo({ video, className }: { video: HTMLVideoElement; className: string }) {
  const attach = useCallback((host: HTMLDivElement | null) => {
    if (!host) return;
    video.className = "h-full w-full object-cover";
    host.append(video);
  }, [video]);
  return <div ref={attach} className={className} />;
}