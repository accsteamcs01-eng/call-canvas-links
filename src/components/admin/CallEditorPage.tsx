import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Copy, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Call } from "@/lib/calls";
import { AdminCallForm } from "./AdminCallForm";
import { PhonePreview } from "./PhonePreview";

export function CallEditorPage({ initial }: { initial?: Call | null }) {
  const qc = useQueryClient();
  const [saved, setSaved] = useState<Call | null>(initial ?? null);
  const [preview, setPreview] = useState(false);
  const link = saved ? `${window.location.origin}/c/${saved.slug}` : "";

  return (
    <div className="mx-auto min-h-dvh max-w-2xl px-4 py-8">
      <Link to="/admin" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <h1 className="mb-6 font-display text-2xl font-semibold">{initial ? "Editar chamada" : "Nova chamada"}</h1>

      {saved && (
        <div className="mb-6 space-y-3 rounded-2xl border border-primary/40 bg-accent p-4">
          <p className="text-sm font-medium">Link da chamada</p>
          <div className="flex gap-2">
            <Input readOnly value={link} onFocus={(e) => e.target.select()} />
            <Button onClick={() => { navigator.clipboard.writeText(link); toast.success("Link copiado"); }}>
              <Copy className="h-4 w-4" /> Copiar link
            </Button>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setPreview(true)}><Eye className="h-4 w-4" /> Pré-visualização</Button>
        </div>
      )}

      <AdminCallForm
        key={saved?.id ?? "new"}
        initial={saved}
        onSaved={(c) => {
          setSaved(c);
          qc.invalidateQueries({ queryKey: ["calls"] });
          toast.success("Chamada salva");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
      <PhonePreview slug={preview && saved ? saved.slug : null} onClose={() => setPreview(false)} />
    </div>
  );
}
