import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Eye, LogOut, Pencil, Plus, CopyPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhonePreview } from "@/components/admin/PhonePreview";
import { supabase } from "@/integrations/supabase/client";
import { aggregateStats, formatDuration, randomSlug, type Call } from "@/lib/calls";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Minhas chamadas — CallSim" },
      { name: "description", content: "Gerencie suas chamadas de vídeo." },
      { property: "og:title", content: "Minhas chamadas — CallSim" },
      { property: "og:description", content: "Gerencie suas chamadas de vídeo." },
    ],
  }),
  component: AdminHome,
});

const callLink = (slug: string) => `${window.location.origin}/c/${slug}`;

function AdminHome() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["calls"],
    queryFn: async () => {
      const { data: calls, error } = await supabase.from("calls").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      const ids = calls.map((c) => c.id);
      const { data: ev } = ids.length
        ? await supabase.from("call_events").select("call_id,event,duration_seconds").in("call_id", ids)
        : { data: [] };
      return { calls, stats: aggregateStats(ev ?? []) };
    },
  });

  const copy = (slug: string) => {
    navigator.clipboard.writeText(callLink(slug));
    toast.success("Link copiado");
  };
  const remove = async (c: Call) => {
    if (!confirm(`Excluir "${c.title}"?`)) return;
    const { error } = await supabase.from("calls").delete().eq("id", c.id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["calls"] });
  };
  const duplicate = async (c: Call) => {
    const { id: _id, created_at: _c, slug: _s, user_id: _u, ...rest } = c;
    const { error } = await supabase.from("calls").insert({ ...rest, title: rest.title + " (cópia)", slug: randomSlug() });
    if (error) { toast.error(error.message); return; }
    toast.success("Chamada duplicada");
    qc.invalidateQueries({ queryKey: ["calls"] });
  };
  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="mx-auto min-h-dvh max-w-5xl px-4 py-8">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-brand" />
          <h1 className="font-display text-2xl font-semibold">Minhas chamadas</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/admin/new"><Plus className="h-4 w-4" /> Nova chamada</Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sair"><LogOut className="h-4 w-4" /></Button>
        </div>
      </header>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : !data?.calls.length ? (
        <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
          Nenhuma chamada ainda. Crie a primeira em “Nova chamada”.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.calls.map((c) => {
            const s = data.stats[c.id] ?? { opened: 0, answered: 0, declined: 0, avgDuration: 0 };
            return (
              <article key={c.id} className="overflow-hidden rounded-2xl border bg-card shadow-card">
                <div className="relative h-28 bg-muted">
                  {c.background_url && <img src={c.background_url} alt="" className="h-full w-full object-cover opacity-70" />}
                  <div className="absolute -bottom-7 left-4 h-14 w-14 overflow-hidden rounded-full border-4 border-card bg-secondary">
                    {c.person_photo_url && <img src={c.person_photo_url} alt="" className="h-full w-full object-cover" />}
                  </div>
                </div>
                <div className="space-y-3 p-4 pt-9">
                  <div>
                    <h2 className="truncate font-semibold">{c.title}</h2>
                    <p className="truncate text-sm text-muted-foreground">
                      {c.person_name} · {new Date(c.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="grid grid-cols-4 gap-1 rounded-lg bg-secondary p-2 text-center">
                    <Stat n={s.opened} l="Aberturas" />
                    <Stat n={s.answered} l="Atendidas" />
                    <Stat n={s.declined} l="Recusadas" />
                    <Stat n={formatDuration(s.avgDuration)} l="Média" />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Button size="sm" onClick={() => copy(c.slug)}><Copy className="h-3.5 w-3.5" /> Copiar link</Button>
                    <Button size="sm" variant="secondary" onClick={() => setPreview(c.slug)} aria-label="Pré-visualizar"><Eye className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="secondary" asChild aria-label="Editar">
                      <Link to="/admin/$id" params={{ id: c.id }}><Pencil className="h-3.5 w-3.5" /></Link>
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => duplicate(c)} aria-label="Duplicar"><CopyPlus className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="secondary" onClick={() => remove(c)} aria-label="Excluir"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <PhonePreview slug={preview} onClose={() => setPreview(null)} />
    </div>
  );
}

function Stat({ n, l }: { n: number | string; l: string }) {
  return (
    <div>
      <div className="text-sm font-semibold tabular-nums">{n}</div>
      <div className="text-[10px] text-muted-foreground">{l}</div>
    </div>
  );
}
