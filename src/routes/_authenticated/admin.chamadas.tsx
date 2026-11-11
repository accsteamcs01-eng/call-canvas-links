import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Archive, ArchiveRestore, Copy, CopyPlus, Eye, LayoutGrid, List, MoreHorizontal, Pencil, PhoneCall, Plus, Search, Share2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PhonePreview } from "@/components/admin/PhonePreview";
import { supabase } from "@/integrations/supabase/client";
import { randomSlug, type Call } from "@/lib/calls";
import { useCallsData } from "@/admin/data";
import { summarize, type EventRow } from "@/admin/metrics";
import { EmptyState } from "@/admin/components/EmptyState";
import { ConfirmDialog } from "@/admin/components/ConfirmDialog";
import { ShareDialog, callLink } from "@/admin/components/ShareDialog";

export const Route = createFileRoute("/_authenticated/admin/chamadas")({
  head: () => ({
    meta: [
      { title: "Chamadas — CallSim" },
      { name: "description", content: "Gerencie, compartilhe e organize suas chamadas de vídeo." },
      { property: "og:title", content: "Chamadas — CallSim" },
      { property: "og:description", content: "Gerencie, compartilhe e organize suas chamadas de vídeo." },
    ],
  }),
  component: CallsPage,
});

type Filter = "all" | "active" | "archived";
type Sort = "recent" | "opened" | "answered" | "az";

function CallsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading } = useCallsData();
  const [view, setView] = useState<"grid" | "table">("grid");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<string | null>(null);
  const [share, setShare] = useState<Call | null>(null);
  const [confirm, setConfirm] = useState<string[] | null>(null);

  const rows = useMemo(() => {
    if (!data) return [];
    const by = new Map<string, EventRow[]>();
    for (const e of data.events) by.set(e.call_id, [...(by.get(e.call_id) ?? []), e]);
    const term = q.trim().toLowerCase();
    return data.calls
      .filter((c) => filter === "all" ? !c.archived : filter === "archived" ? c.archived : !c.archived && c.is_active)
      .filter((c) => !term || c.title.toLowerCase().includes(term) || c.person_name.toLowerCase().includes(term))
      .map((c) => ({ c, s: summarize(by.get(c.id) ?? []) }))
      .sort((a, b) =>
        sort === "opened" ? b.s.opened - a.s.opened
        : sort === "answered" ? b.s.answered - a.s.answered
        : sort === "az" ? a.c.title.localeCompare(b.c.title, "pt-BR")
        : +new Date(b.c.created_at) - +new Date(a.c.created_at));
  }, [data, q, filter, sort]);

  const refresh = () => qc.invalidateQueries({ queryKey: ["calls"] });
  const toggleSel = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allSelected = rows.length > 0 && rows.every((r) => sel.has(r.c.id));

  const update = async (ids: string[], patch: { archived?: boolean; is_active?: boolean }, msg: string) => {
    const { error } = await supabase.from("calls").update(patch).in("id", ids);
    if (error) { toast.error(error.message); return; }
    toast.success(msg);
    setSel(new Set());
    refresh();
  };
  const remove = async (ids: string[]) => {
    const { error } = await supabase.from("calls").delete().in("id", ids);
    setConfirm(null);
    if (error) { toast.error(error.message); return; }
    toast.success(ids.length > 1 ? `${ids.length} chamadas excluídas` : "Chamada excluída");
    setSel(new Set());
    refresh();
  };
  const duplicate = async (c: Call) => {
    const { id: _i, created_at: _c, slug: _s, user_id: _u, ...rest } = c;
    const { error } = await supabase.from("calls").insert({ ...rest, title: rest.title + " (cópia)", slug: randomSlug() });
    if (error) { toast.error(error.message); return; }
    toast.success("Chamada duplicada");
    refresh();
  };
  const copy = (slug: string) => { navigator.clipboard.writeText(callLink(slug)); toast.success("Link copiado"); };

  const Actions = ({ c }: { c: Call }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Ações"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="admin-root w-48">
        <DropdownMenuItem onClick={() => copy(c.slug)}><Copy className="h-4 w-4" /> Copiar link</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setShare(c)}><Share2 className="h-4 w-4" /> Compartilhar</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setPreview(c.slug)}><Eye className="h-4 w-4" /> Pré-visualizar</DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate({ to: "/admin/$id", params: { id: c.id } })}><Pencil className="h-4 w-4" /> Editar</DropdownMenuItem>
        <DropdownMenuItem onClick={() => duplicate(c)}><CopyPlus className="h-4 w-4" /> Duplicar</DropdownMenuItem>
        <DropdownMenuItem onClick={() => update([c.id], { archived: !c.archived }, c.archived ? "Chamada restaurada" : "Chamada arquivada")}>
          {c.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />} {c.archived ? "Desarquivar" : "Arquivar"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setConfirm([c.id])}><Trash2 className="h-4 w-4" /> Excluir</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
  const Status = ({ c }: { c: Call }) => c.archived ? <Badge variant="secondary">Arquivada</Badge>
    : c.is_active ? <Badge className="border-0 bg-admin-green/15 text-admin-green hover:bg-admin-green/15">Ativa</Badge>
    : <Badge variant="outline" className="text-muted-foreground">Inativa</Badge>;
  const ActiveSwitch = ({ c }: { c: Call }) => (
    <Switch checked={c.is_active} aria-label="Ativa" onCheckedChange={(v) => update([c.id], { is_active: v }, v ? "Chamada ativada" : "Chamada desativada")} />
  );

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por título ou pessoa..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={filter} onValueChange={(v) => { setFilter(v as Filter); setSel(new Set()); }}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent className="admin-root"><SelectItem value="all">Todas</SelectItem><SelectItem value="active">Ativas</SelectItem><SelectItem value="archived">Arquivadas</SelectItem></SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent className="admin-root"><SelectItem value="recent">Mais recentes</SelectItem><SelectItem value="opened">Mais abertas</SelectItem><SelectItem value="answered">Mais atendidas</SelectItem><SelectItem value="az">A-Z</SelectItem></SelectContent>
        </Select>
        <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as "grid" | "table")} className="rounded-lg border p-0.5">
          <ToggleGroupItem value="grid" aria-label="Grade" className="h-8 w-8"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
          <ToggleGroupItem value="table" aria-label="Tabela" className="h-8 w-8"><List className="h-4 w-4" /></ToggleGroupItem>
        </ToggleGroup>
      </div>

      {sel.size > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-sm">
          <span className="font-medium">{sel.size} selecionada(s)</span>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => update([...sel], { archived: filter !== "archived" }, filter === "archived" ? "Chamadas restauradas" : "Chamadas arquivadas")}>
              <Archive className="h-4 w-4" /> {filter === "archived" ? "Desarquivar" : "Arquivar"}
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setConfirm([...sel])}><Trash2 className="h-4 w-4" /> Excluir</Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}</div>
      ) : !rows.length ? (
        <EmptyState icon={PhoneCall} title={q || filter !== "all" ? "Nada encontrado" : "Nenhuma chamada ainda"} text={q || filter !== "all" ? "Tente outra busca ou filtro." : "Crie sua primeira chamada e envie o link para alguém."}
          action={<Button asChild><Link to="/admin/new"><Plus className="h-4 w-4" /> Nova chamada</Link></Button>} />
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ c, s }) => (
            <article key={c.id} className={`group overflow-hidden rounded-2xl border bg-card shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40 ${sel.has(c.id) ? "ring-2 ring-primary" : ""}`}>
              <div className="relative h-28 bg-muted">
                {c.background_url && <img src={c.background_url} alt="" className="h-full w-full object-cover opacity-80" />}
                <Checkbox checked={sel.has(c.id)} onCheckedChange={() => toggleSel(c.id)} aria-label="Selecionar" className="absolute left-3 top-3 border-admin-white bg-background/60" />
                <div className="absolute right-2 top-2 rounded-lg bg-background/70 backdrop-blur"><Actions c={c} /></div>
                <div className="absolute -bottom-7 left-4 h-14 w-14 overflow-hidden rounded-full border-4 border-card bg-secondary">
                  {c.person_photo_url && <img src={c.person_photo_url} alt="" className="h-full w-full object-cover" />}
                </div>
              </div>
              <div className="space-y-3 p-4 pt-9">
                <div className="flex items-start justify-between gap-2">
                  <Link to="/admin/$id" params={{ id: c.id }} className="min-w-0">
                    <h3 className="truncate font-semibold hover:text-primary">{c.title}</h3>
                    <p className="truncate text-sm text-muted-foreground">{c.person_name} · {new Date(c.created_at).toLocaleDateString("pt-BR")}</p>
                  </Link>
                  <Status c={c} />
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span><b className="tabular-nums">{s.opened}</b> <span className="text-muted-foreground">aberturas</span></span>
                  <span><b className="tabular-nums">{s.answered}</b> <span className="text-muted-foreground">atendidas</span></span>
                </div>
                <div className="flex items-center gap-2 border-t pt-3">
                  <Button size="sm" onClick={() => copy(c.slug)}><Copy className="h-3.5 w-3.5" /> Copiar link</Button>
                  <Button size="sm" variant="secondary" onClick={() => setShare(c)}><Share2 className="h-3.5 w-3.5" /> Compartilhar</Button>
                  <div className="ml-auto"><ActiveSwitch c={c} /></div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"><Checkbox checked={allSelected} onCheckedChange={(v) => setSel(v ? new Set(rows.map((r) => r.c.id)) : new Set())} aria-label="Selecionar todas" /></TableHead>
                <TableHead>Chamada</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aberturas</TableHead>
                <TableHead className="text-right">Atendidas</TableHead><TableHead>Criada em</TableHead><TableHead>Ativa</TableHead><TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ c, s }) => (
                <TableRow key={c.id} data-state={sel.has(c.id) ? "selected" : undefined}>
                  <TableCell><Checkbox checked={sel.has(c.id)} onCheckedChange={() => toggleSel(c.id)} aria-label="Selecionar" /></TableCell>
                  <TableCell>
                    <Link to="/admin/$id" params={{ id: c.id }} className="flex items-center gap-3">
                      <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {c.background_url && <img src={c.background_url} alt="" className="h-full w-full object-cover" />}
                        {c.person_photo_url && <img src={c.person_photo_url} alt="" className="absolute bottom-0.5 right-0.5 h-6 w-6 rounded-full border-2 border-card object-cover" />}
                      </div>
                      <div className="min-w-0"><div className="truncate font-medium">{c.title}</div><div className="truncate text-xs text-muted-foreground">{c.person_name}</div></div>
                    </Link>
                  </TableCell>
                  <TableCell><Status c={c} /></TableCell>
                  <TableCell className="text-right tabular-nums">{s.opened}</TableCell>
                  <TableCell className="text-right tabular-nums">{s.answered}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{new Date(c.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell><ActiveSwitch c={c} /></TableCell>
                  <TableCell><Actions c={c} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <PhonePreview slug={preview} onClose={() => setPreview(null)} />
      <ShareDialog call={share} onClose={() => setShare(null)} />
      <ConfirmDialog open={!!confirm} title={confirm && confirm.length > 1 ? `Excluir ${confirm.length} chamadas?` : "Excluir chamada?"}
        text="Esta ação não pode ser desfeita. O link deixará de funcionar." onConfirm={() => confirm && remove(confirm)} onClose={() => setConfirm(null)} />
    </div>
  );
}
