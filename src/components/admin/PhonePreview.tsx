import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function PhonePreview({ slug, onClose }: { slug: string | null; onClose: () => void }) {
  return (
    <Dialog open={!!slug} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-auto max-w-none border-0 bg-transparent p-0 shadow-none">
        <DialogHeader className="sr-only">
          <DialogTitle>Pré-visualização</DialogTitle>
        </DialogHeader>
        {slug && (
          <div className="rounded-[48px] bg-call-black p-3 shadow-card ring-1 ring-border">
            <iframe
              key={slug}
              src={`/c/${slug}?preview=1`}
              title="Pré-visualização"
              allow="autoplay; camera; fullscreen"
              className="h-[min(780px,85dvh)] w-[min(375px,88vw)] rounded-[38px] border-0"
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
