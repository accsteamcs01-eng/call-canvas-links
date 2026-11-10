import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

const SIZE = 280;

/** Circular crop with zoom and drag; outputs a 512px square JPEG. */
export function ImageCropper({ file, onDone, onCancel }: { file: File | null; onDone: (b: Blob) => void; onCancel: () => void }) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const i = new Image();
    i.onload = () => setImg(i);
    i.src = url;
    setZoom(1);
    setOff({ x: 0, y: 0 });
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const base = img ? SIZE / Math.min(img.width, img.height) : 1;
  const w = img ? img.width * base * zoom : 0;
  const h = img ? img.height * base * zoom : 0;

  const save = () => {
    if (!img) return;
    const out = 512;
    const c = document.createElement("canvas");
    c.width = c.height = out;
    const ctx = c.getContext("2d")!;
    const k = out / SIZE;
    ctx.drawImage(img, (SIZE / 2 - w / 2 + off.x) * k, (SIZE / 2 - h / 2 + off.y) * k, w * k, h * k);
    c.toBlob((b) => b && onDone(b), "image/jpeg", 0.9);
  };

  return (
    <Dialog open={!!file} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Recortar foto</DialogTitle>
        </DialogHeader>
        <div
          className="relative mx-auto touch-none overflow-hidden rounded-full bg-muted"
          style={{ width: SIZE, height: SIZE }}
          onPointerDown={(e) => {
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            drag.current = { x: e.clientX, y: e.clientY, ox: off.x, oy: off.y };
          }}
          onPointerMove={(e) => {
            if (drag.current) setOff({ x: drag.current.ox + e.clientX - drag.current.x, y: drag.current.oy + e.clientY - drag.current.y });
          }}
          onPointerUp={() => (drag.current = null)}
        >
          {img && (
            <img
              src={img.src}
              alt=""
              draggable={false}
              className="absolute max-w-none cursor-grab select-none"
              style={{ width: w, height: h, left: SIZE / 2 - w / 2 + off.x, top: SIZE / 2 - h / 2 + off.y }}
            />
          )}
        </div>
        <Slider min={1} max={3} step={0.01} value={[zoom]} onValueChange={([v]) => setZoom(v ?? 1)} />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button onClick={save}>Usar foto</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
