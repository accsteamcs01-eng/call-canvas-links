import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FolderOpen, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { libraryQueryOptions, LIBRARY_BUCKETS } from "@/admin/library";
import type { Bucket } from "@/lib/calls";
import { MediaThumb } from "./MediaThumb";

export function MediaPicker({ bucket, onPick }: { bucket: Bucket; onPick: (url: string) => void }) {
  const [open, setOpen] = useState(false);
  const q = useQuery({ ...libraryQueryOptions, enabled: open });
  const items = (q.data ?? []).filter((i) => i.bucket === bucket);
  const label = LIBRARY_BUCKETS.find((b) => b.id === bucket)?.label ?? "";
  return (
    <>
      <Button type="button" variant="ghost" size="sm" className="h-auto px-0 text-primary" onClick={() => setOpen(true)}>
        <FolderOpen className="h-4 w-4" /> Escolher da biblioteca
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="admin-root max-w-2xl">
          <DialogHeader>
            <DialogTitle>Biblioteca · {label}</DialogTitle>
          </DialogHeader>
          {q.isLoading ? (
            <div className="grid place-items-center py-12"><LoaderCircle className="animate-spin text-muted-foreground" /></div>
          ) : !items.length ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Nenhum arquivo enviado ainda.</p>
          ) : (
            <div className="grid max-h-[60vh] grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4">
              {items.map((it) => (
                <button
                  key={it.path}
                  type="button"
                  onClick={() => { onPick(it.url); setOpen(false); }}
                  className="group overflow-hidden rounded-lg border text-left transition hover:border-primary"
                >
                  <div className="aspect-square overflow-hidden bg-muted"><MediaThumb item={it} /></div>
                  <p className="truncate px-2 py-1.5 text-xs text-muted-foreground">{it.name}</p>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
