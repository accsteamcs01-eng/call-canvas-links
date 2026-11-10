import { useEffect, useRef, useState } from "react";
import { Avatar } from "./CallBackdrop";

type Corner = "tl" | "tr" | "bl" | "br";

interface Props {
  stream: MediaStream | null;
  cameraOn: boolean;
  mirrored: boolean;
  name?: string;
  bottomInset: number;
}

const W = 108;
const H = 160;
const M = 12;

/** Draggable rounded self-view that snaps to the nearest corner. */
export function SelfView({ stream, cameraOn, mirrored, bottomInset }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [corner, setCorner] = useState<Corner>("tr");
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const start = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream, cameraOn]);

  const parentRect = () => boxRef.current?.parentElement?.getBoundingClientRect();

  const cornerPos = (c: Corner) => {
    const r = parentRect();
    const pw = r?.width ?? 390;
    const ph = r?.height ?? 800;
    const top = 76;
    return {
      x: c.endsWith("l") ? M : pw - W - M,
      y: c.startsWith("t") ? top : ph - H - bottomInset - M,
    };
  };

  const pos = drag ?? cornerPos(corner);

  return (
    <div
      ref={boxRef}
      className="absolute z-20 overflow-hidden rounded-2xl bg-call-dark shadow-2xl ring-1 ring-call-ink/10 touch-none"
      style={{
        width: W,
        height: H,
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        transition: drag ? "none" : "transform 260ms cubic-bezier(.2,.8,.2,1)",
        left: 0,
        top: 0,
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        start.current = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y };
        setDrag({ x: pos.x, y: pos.y });
      }}
      onPointerMove={(e) => {
        if (!start.current) return;
        setDrag({ x: start.current.x + e.clientX - start.current.px, y: start.current.y + e.clientY - start.current.py });
      }}
      onPointerUp={() => {
        const r = parentRect();
        if (drag && r) {
          const cx = drag.x + W / 2;
          const cy = drag.y + H / 2;
          setCorner(`${cy < r.height / 2 ? "t" : "b"}${cx < r.width / 2 ? "l" : "r"}` as Corner);
        }
        start.current = null;
        setDrag(null);
      }}
    >
      {stream && cameraOn ? (
        <video
          ref={videoRef}
          muted
          playsInline
          autoPlay
          className="h-full w-full object-cover"
          style={{ transform: mirrored ? "scaleX(-1)" : undefined }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-call-glass">
          <Avatar name="Você" size={56} />
        </div>
      )}
    </div>
  );
}
