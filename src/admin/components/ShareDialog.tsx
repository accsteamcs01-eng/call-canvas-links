import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Copy, Download } from "lucide-react";
import { ThemeIcon } from "@/themes/ThemeIcon";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Call } from "@/lib/calls";

export const callLink = (slug: string) => `${window.location.origin}/c/${slug}`;

export function ShareDialog({ call, onClose }: { call: Call | null; onClose: () => void }) {
  const link = call ? callLink(call.slug) : "";
  const [msg, setMsg] = useState("");
  const [qr, setQr] = useState("");
  useEffect(() => {
    if (!call) return;
    setMsg(`Oi! Tenho uma chamada de vídeo para você 📞 Toque para atender: ${link}`);
    QRCode.toDataURL(link, { width: 512, margin: 2 }).then(setQr);
  }, [call, link]);
  return (
    <Dialog open={!!call} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="admin-root max-w-md rounded-2xl">
        <DialogHeader><DialogTitle>Compartilhar “{call?.title}”</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input readOnly value={link} onFocus={(e) => e.target.select()} />
            <Button onClick={() => { navigator.clipboard.writeText(link); toast.success("Link copiado"); }}><Copy className="h-4 w-4" /></Button>
          </div>
          <div className="space-y-2">
            <Textarea rows={3} value={msg} onChange={(e) => setMsg(e.target.value)} />
            <Button className="w-full bg-admin-green text-admin-white hover:bg-admin-green/90" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank")}>
              <ThemeIcon theme="whatsapp" className="h-5 w-5" /> Enviar no WhatsApp
            </Button>
          </div>
          {qr && (
            <div className="flex flex-col items-center gap-3 rounded-xl border bg-muted/40 p-4">
              <img src={qr} alt="QR Code do link" className="h-44 w-44 rounded-lg" />
              <Button variant="secondary" size="sm" asChild>
                <a href={qr} download={`chamada-${call?.slug}.png`}><Download className="h-4 w-4" /> Baixar PNG</a>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
