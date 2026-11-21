import { ImageIcon, Link2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { previewImageError, resolveLinkPreview } from "../link-preview";

interface Props {
  name: string;
  photo: string | null;
  image: string | null;
  title: string;
  description: string;
  busy: boolean;
  onImage: (value: string | null) => void;
  onTitle: (value: string) => void;
  onDescription: (value: string) => void;
  onUpload: (file: File) => Promise<string | null>;
}

export function LinkPreviewFields(props: Props) {
  const preview = resolveLinkPreview(props);
  const defaults = resolveLinkPreview({ ...props, title: "", description: "" });

  return (
    <section className="space-y-4" aria-labelledby="link-preview-heading">
      <h2 id="link-preview-heading" className="flex items-center gap-2 text-lg font-semibold">
        <Link2 className="h-5 w-5" />
        Prévia do link
      </h2>
      <div className="space-y-2">
        <Label htmlFor="preview-image">Imagem de prévia</Label>
        <p id="preview-image-hint" className="text-xs text-muted-foreground">
          1200x630 para card grande ou 600x600 para miniatura; até 300 KB
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" asChild disabled={props.busy}>
            <label
              className={props.busy ? "pointer-events-none opacity-50" : "cursor-pointer"}
              htmlFor="preview-image"
            >
              <Upload className="h-4 w-4" />
              {props.image ? "Trocar imagem" : "Enviar imagem"}
            </label>
          </Button>
          <input
            id="preview-image"
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={props.busy}
            aria-describedby="preview-image-hint"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              const error = previewImageError(file);
              if (error) return void toast.error(error);
              const url = await props.onUpload(file);
              if (url) props.onImage(url);
            }}
          />
          {props.image && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={props.busy}
              onClick={() => props.onImage(null)}
            >
              <X className="h-4 w-4" />
              Usar foto da pessoa
            </Button>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="preview-title">Título da prévia</Label>
        <Input
          id="preview-title"
          value={props.title}
          placeholder={defaults.title}
          onChange={(event) => props.onTitle(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="preview-description">Descrição da prévia</Label>
        <Textarea
          id="preview-description"
          rows={2}
          value={props.description}
          placeholder={defaults.description}
          onChange={(event) => props.onDescription(event.target.value)}
        />
      </div>
      <figure
        aria-label="Card simulado da prévia"
        className="max-w-sm overflow-hidden rounded-lg border bg-muted"
      >
        {preview.image ? (
          <img
            src={preview.image}
            alt="Imagem de prévia do link"
            className="aspect-[1200/630] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[1200/630] items-center justify-center bg-secondary">
            <ImageIcon className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
        <figcaption className="space-y-1 p-3">
          <p className="break-words text-sm font-semibold">{preview.title}</p>
          <p className="break-words text-xs text-muted-foreground">{preview.description}</p>
        </figcaption>
      </figure>
    </section>
  );
}
