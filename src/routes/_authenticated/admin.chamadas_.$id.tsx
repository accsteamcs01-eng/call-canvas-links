import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Archive, ArchiveRestore, ArrowLeft, Clock, Copy, Eye, Pencil, PhoneCall, PhoneIncoming, PhoneOff, Percent, Share2 } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { formatDuration, type Call } from "@/lib/calls";
import { dailySeries, periodStart, summarize, type EventRow, type Period } from "@/admin/metrics";
import { StatCard } from "@/admin/components/StatCard";
import { EmptyState } from "@/admin/components/EmptyState";
import { ShareDialog, callLink } from "@/admin/components/ShareDialog";
import { PhonePreview } from "@/components/admin/PhonePreview";

export const Route = createFileRoute("/_authenticated/admin/chamadas_/$id")({
  head: () => ({
    meta: [
      { title: "Métricas da chamada — CallSim" },
      { name: "description", content: "Desempenho e histórico de uma chamada de vídeo." },
      { property: "og:title", content: "Métricas da chamada — CallSim" },
      { property: "og:description", content: "Desempenho e histórico de uma chamada de vídeo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CallMetricsPage,
});

const EVENT_LABEL: Record<string, { label: string; tone: string }> = {
  opened: { label: "Aberta", tone: "bg-primary/10 text-primary" },
  answered: { label: "Atendida", tone: "bg-admin-green/15 text-admin-green" },
  declined: { label: "Recusada", tone: "bg-destructive/10 text-destructive" },
  ended: { label: "Encerrada", tone: "bg-muted text-muted-foreground" },
};
const PERIODS: { v: Period; l: string }[] = [{ v: "7d", l: "7 dias" }, { v: "30d", l: "30 dias" }, { v: "all", l: "Tudo" }];

function CallMetricsPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [period, setPeriod] = useState<Period>("30d");
  const [share, setShare] = useState<Call | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["call-metrics", id],
    queryFn: async () => {
      const [c, e] = await Promise.all([
        supabase.from("calls").select("*").eq("id", id).maybeSingle(),
        supabase.from("call_events").select("call_id,event,duration_seconds,created_at").eq("call_id", id).order("created_at", { ascending: false }).limit(5000),
      ]);
      if (c.error) throw c.error;
      if (e.error) throw e.error;
      return { call: c.data as Call | null, events: (e.data ?? []) as EventRow[] };
    },
  });

  const start = periodStart(period);
  const filtered = useMemo(() => (data?.events ?? []).filter((e) => !start || new Date(e.created_at) >= start), [data, start]);
  const s = summarize(filtered);
  const series = useMemo(() => dailySeries(filtered, start), [filtered, start]);

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-28 rounded-2xl" /><Skeleton className="h-72 rounded-2xl" /></div>;
  const call = data?.call;
  if (!call) return <EmptyState icon={PhoneCall} title="Chamada não encontrada" text="Ela pode ter sido excluída." action={<Button asChild><Link to="/admin/chamadas">Voltar às chamadas</Link></Button>} />;

  const refresh = () => { qc.invalidateQueries({ queryKey: ["call-metrics", id] }); qc.invalidateQueries({ queryKey: ["calls"] }); };
  const update = async (patch: { archived?: boolean; is_active?: boolean }, msg: string) => {
    const { error } = await supabase.from("calls").update(patch).eq("id", call.id);
    if (error) { toast.error(error.message); return; }
    toast.success(msg); refresh();
  };
  const copy = () => { navigator.clipboard.writeText(callLink(call.slug)); toast.success("Link copiado"); };

  return (
    <div className="space-y-6">
      <Link to="/admin/chamadas" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Chamadas</Link>

      <header className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-card md:flex-row md:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-secondary">
            {call.person_photo_url && <img src={call.person_photo_url} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-semibold">{call.title || call.person_name}</h1>
              {call.archived ? <Badge variant="secondary">Arquivada</Badge> : call.is_active ? <Badge className="bg-admin-green/15 text-admin-green hover:bg-admin-green/15">Ativa</Badge> : <Badge variant="outline">Inativa</Badge>}
            </div>
            <p className="truncate text-sm text-muted-foreground">{call.person_name} · /c/{call.slug} · criada em {new Date(call.created_at).toLocaleDateString("pt-BR")}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:ml-auto">
          <label className="mr-2 flex items-center gap-2 text-sm"><Switch checked={call.is_active} onCheckedChange={(v) => update({ is_active: v }, v ? "Chamada ativada" : "Chamada desativada")} aria-label="Ativa" /> Ativa</label>
          <Button size="sm" onClick={copy}><Copy className="h-4 w-4" /> Copiar link</Button>
          <Button size="sm" variant="secondary" onClick={() => setShare(call)}><Share2 className="h-4 w-4" /> Compartilhar</Button>
          <Button size="sm" variant="secondary" onClick={() => setPreview(call.slug)}><Eye className="h-4 w-4" /> Ver</Button>
          <Button size="sm" variant="secondary" asChild><Link to="/admin/$id" params={{ id: call.id }}><Pencil className="h-4 w-4" /> Editar</Link></Button>
          <Button size="sm" variant="ghost" onClick={() => update({ archived: !call.archived }, call.archived ? "Chamada restaurada" : "Chamada arquivada")}>
            {call.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />} {call.archived ? "Desarquivar" : "Arquivar"}
          </Button>
        </div>
      </header>

      <div className="flex gap-1 rounded-lg border bg-card p-1 w-fit">
        {PERIODS.map((p) => <Button key={p.v} size="sm" variant={period === p.v ? "default" : "ghost"} onClick={() => setPeriod(p.v)}>{p.l}</Button>)}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard icon={PhoneIncoming} label="Aberturas" value={s.opened} />
        <StatCard icon={PhoneCall} label="Atendidas" value={s.answered} tone="success" />
        <StatCard icon={PhoneOff} label="Recusadas" value={s.declined} tone="danger" />
        <StatCard icon={Percent} label="Taxa de atendimento" value={`${s.rate}%`} />
        <StatCard icon={Clock} label="Duração média" value={formatDuration(Math.round(s.avgDuration))} tone="muted" />
      </div>

      <section className="rounded-2xl border bg-card p-5 shadow-card">
        <h2 className="mb-4 font-semibold">Aberturas x atendimentos por dia</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ left: -20, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Legend />
              <Line type="monotone" dataKey="opened" name="Aberturas" stroke="var(--primary)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="answered" name="Atendidas" stroke="var(--admin-green)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border bg-card shadow-card">
        <h2 className="p-5 pb-2 font-semibold">Histórico de eventos</h2>
        {filtered.length === 0 ? <p className="p-5 pt-0 text-sm text-muted-foreground">Nenhum evento neste período.</p> : (
          <div className="max-h-[480px] overflow-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Evento</TableHead><TableHead>Data e hora</TableHead><TableHead className="text-right">Duração</TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.slice(0, 200).map((e, i) => {
                  const m = EVENT_LABEL[e.event] ?? { label: e.event, tone: "bg-muted" };
                  return (
                    <TableRow key={i}>
                      <TableCell><span className={`rounded-md px-2 py-0.5 text-xs font-medium ${m.tone}`}>{m.label}</span></TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{new Date(e.created_at).toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-right tabular-nums">{e.duration_seconds != null ? formatDuration(e.duration_seconds) : "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <PhonePreview slug={preview} onClose={() => setPreview(null)} />
      <ShareDialog call={share} onClose={() => setShare(null)} />
    </div>
  );
}
