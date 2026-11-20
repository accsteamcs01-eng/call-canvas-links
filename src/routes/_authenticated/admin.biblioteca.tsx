import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, FolderOpen, LoaderCircle, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/admin/components/ConfirmDialog";
import { EmptyState } from "@/admin/components/EmptyState";
import { MediaThumb } from "@/admin/components/MediaThumb";
import {
  formatBytes, libraryQueryOptions, libraryUsageQueryOptions, LIBRARY_BUCKETS, mediaUsage, type MediaItem,
} from "@/admin/library";
import { supabase } from "@/integrations/supabase/client";
import { uploadMedia, type Bucket } from "@/lib/calls";

export const Route = createFileRoute("/_authenticated/admin/biblioteca")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(libraryQueryOptions),
      context.queryClient.ensureQueryData(libraryUsageQueryOptions),
    ]),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Biblioteca — CallSim" },
      { name: "description", content: "Fotos, capas, toques e vídeos enviados." },
      { property: "og:title", content: "Biblioteca — CallSim" },
      { property: "og:description", content: "Fotos, capas, toques e vídeos enviados." },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const qc = useQueryClient();
  const { data: items } = useSuspenseQuery(libraryQueryOptions);
  const { data: urls } = useSuspenseQuery(libraryUsageQueryOptions);
  const [tab, setTab] = useState<"all" | Bucket>("all");
  const [busy, setBusy] = useState(false);
  const [remove, setRemove] = useState<MediaItem | null>(null);
  const usage = mediaUsage(items, urls);
  const rows = tab === "all" ? items : items.filter((i) => i.bucket === tab);
  const total = items.reduce((s, i) => s + i.size, 0);
  const uploadBucket: Bucket = tab === "all" ? "photos" : tab;
  const accept = LIBRARY_BUCKETS.find((b) => b.id === uploadBucket)!.accept;

  async function onUpload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const f of Array.from(files)) {
        if (uploadBucket === "videos" && f.size > 50 * 1024 * 1024) throw new Error(`${f.name} passa de 50MB`);
        await uploadMedia(uploadBucket, f, f.name.split(".").pop() || "bin");
      }
      await qc.invalidateQueries({ queryKey: ["library"] });
      toast.success("Arquivo enviado");
    } catch (e) {
      toast.error("Falha no envio: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!remove) return;
    const it = remove;
    setRemove(null);
    const { error } = await supabase.storage.from(it.bucket).remove([it.path]);
    if (error) {
      toast.error(error.message);
      return;
    }
    await qc.invalidateQueries({ queryKey: ["library"] });
    toast.success("Arquivo excluído");
  }

  const inUse = remove ? (usage[`${remove.bucket}/${remove.path}`] ?? 0) : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-xl font-semibold">Biblioteca</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? "arquivo" : "arquivos"} · {formatBytes(total)}
          </p>
        </div>
        <Button asChild disabled={busy}>
          <label className="cursor-pointer">
            {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Enviar {LIBRARY_BUCKETS.find((b) => b.id === uploadBucket)!.label.toLowerCase()}
            <input type="file" multiple accept={accept} className="hidden" disabled={busy}
              onChange={(e) => { void onUpload(e.target.files); e.target.value = ""; }} />
          </label>
        </Button>
      </div>
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="all">Todos ({items.length})</TabsTrigger>
          {LIBRARY_BUCKETS.map((b) => (
            <TabsTrigger key={b.id} value={b.id}>
              {b.label} ({items.filter((i) => i.bucket === b.id).length})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {!rows.length ? (
        <EmptyState icon={FolderOpen} title="Nada por aqui ainda"
          text="Os arquivos enviados nas chamadas e contatos aparecem aqui para você reutilizar." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {rows.map((it) => {
            const n = usage[`${it.bucket}/${it.path}`] ?? 0;
            return (
              <div key={`${it.bucket}/${it.path}`} className="overflow-hidden rounded-lg border bg-card">
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <MediaThumb item={it} />
                  {n > 0 && (
                    <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                      Em uso · {n}
                    </span>
                  )}
                </div>
                <div className="space-y-1 p-3">
                  <p className="text-xs font-medium">{LIBRARY_BUCKETS.find((b) => b.id === it.bucket)!.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(it.size)} · {it.createdAt ? new Date(it.createdAt).toLocaleDateString("pt-BR") : ""}
                  </p>
                  <div className="flex gap-1 pt-1">
                    <Button size="sm" variant="secondary" className="h-8 flex-1 text-xs"
                      onClick={() => { void navigator.clipboard.writeText(it.url); toast.success("Link copiado"); }}>
                      <Copy className="h-3.5 w-3.5" /> Copiar
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Excluir arquivo" onClick={() => setRemove(it)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <ConfirmDialog open={!!remove} title="Excluir arquivo?"
        text={inUse > 0
          ? `Este arquivo está em uso em ${inUse} ${inUse === 1 ? "lugar" : "lugares"}. Excluir faz ele parar de aparecer nessas chamadas.`
          : "O arquivo será removido permanentemente."}
        onConfirm={() => void onDelete()} onClose={() => setRemove(null)} />
    </div>
  );
}
