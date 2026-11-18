import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LoaderCircle, Save, Upload, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageCropper } from "@/components/admin/ImageCropper";
import { uploadMedia } from "@/lib/calls";
import { supabase } from "@/integrations/supabase/client";
import type { Contact } from "@/admin/contacts";

export function ContactEditor({
  contact,
  onClose,
}: {
  contact: Contact | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState(contact?.name ?? "");
  const [subtitle, setSubtitle] = useState(contact?.subtitle ?? "Chamada de vídeo");
  const [photo, setPhoto] = useState(contact?.photo_url ?? null);
  const [crop, setCrop] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!name.trim()) {
      toast.error("Informe o nome do contato");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name: name.trim(),
        subtitle: subtitle.trim() || "Chamada de vídeo",
        photo_url: photo,
      };
      const result = contact
        ? await supabase.from("contacts").update(payload).eq("id", contact.id).select().single()
        : await supabase.from("contacts").insert(payload).select().single();
      if (result.error) throw result.error;
      await qc.invalidateQueries({ queryKey: ["contacts"] });
      toast.success(contact ? "Contato atualizado" : "Contato criado");
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open && !busy && !crop) onClose();
        }}
      >
        <DialogContent
          className="admin-root max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg"
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle>{contact ? "Editar contato" : "Novo contato"}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <fieldset disabled={busy} className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-muted">
                  {photo ? (
                    <img src={photo} alt="Foto do contato" className="h-full w-full object-cover" />
                  ) : (
                    <UserRound className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" asChild>
                    <label className="cursor-pointer">
                      <Upload className="h-4 w-4" />
                      {photo ? "Trocar foto" : "Enviar foto"}
                      <input
                        aria-label="Foto do contato"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          setCrop(e.target.files?.[0] ?? null);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </Button>
                  {photo && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label="Remover foto"
                      title="Remover foto"
                      onClick={() => setPhoto(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-name">Nome</Label>
                <Input
                  id="contact-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="off"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-subtitle">Subtítulo padrão</Label>
                <Input
                  id="contact-subtitle"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                />
              </div>
            </fieldset>
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
                Cancelar
              </Button>
              <Button disabled={busy || !!crop} type="submit">
                {busy ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Salvar contato
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <ImageCropper
        file={crop}
        onCancel={() => setCrop(null)}
        onDone={async (blob) => {
          setCrop(null);
          setBusy(true);
          try {
            setPhoto(await uploadMedia("photos", blob, "jpg"));
          } catch (e) {
            toast.error("Falha no envio: " + (e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      />
    </>
  );
}
