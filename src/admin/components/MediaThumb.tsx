import { Music, Play } from "lucide-react";
import type { MediaItem } from "@/admin/library";

export function MediaThumb({ item }: { item: MediaItem }) {
  if (item.bucket === "photos" || item.bucket === "backgrounds")
    return <img src={item.url} alt="" loading="lazy" className="h-full w-full object-cover" />;
  if (item.bucket === "videos")
    return (
      <div className="relative h-full w-full bg-call-black">
        <video src={`${item.url}#t=0.5`} muted playsInline preload="metadata" className="h-full w-full object-cover" />
        <Play className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 text-primary-foreground drop-shadow" />
      </div>
    );
  return (
    <div className="grid h-full w-full place-items-center bg-primary/10 text-primary">
      <Music className="h-8 w-8" />
    </div>
  );
}
