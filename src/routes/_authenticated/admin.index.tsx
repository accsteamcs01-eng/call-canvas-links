import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Activity, CheckCircle2, Clock, Eye, Percent, PhoneCall, PhoneOff, Plus, Trophy } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { callsQueryOptions, useSuspenseCallsData } from "@/admin/data";
import { AdminLoadError, AdminNotFound, AdminPending } from "@/admin/components/RouteFeedback";
import { dailySeries, inPeriod, periodStart, summarize, timeAgo, type Period } from "@/admin/metrics";
import { StatCard } from "@/admin/components/StatCard";
import { EmptyState } from "@/admin/components/EmptyState";
import { formatDuration } from "@/lib/calls";

export const Route = createFileRoute("/_authenticated/admin/")({
  loader: async ({ context }) => { await context.queryClient.ensureQueryData({ ...callsQueryOptions, revalidateIfStale: true }); },
  pendingMs: 150,
  pendingMinMs: 0,
  pendingComponent: AdminPending,
  errorComponent: AdminLoadError,
  notFoundComponent: AdminNotFound,
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Dashboard — CallSim" },
      { name: "description", content: "Visão geral do desempenho das suas chamadas." },
      { property: "og:title", content: "Dashboard — CallSim" },
      { property: "og:description", content: "Visão geral do desempenho das suas chamadas." },
    ],
  }),
  component: Dashboard,
});

const PERIODS: { v: Period; l: string }[] = [{ v: "today", l: "Hoje" }, { v: "7d", l: "7 dias" }, { v: "30d", l: "30 dias" }, { v: "all", l: "Tudo" }];
const EVENT_LABEL: Record<string, string> = { opened: "foi aberta", answered: "foi atendida", declined: "foi recusada", ended: "foi encerrada" };

function Dashboard() {
  const [period, setPeriod] = useState<Period>("7d");
  const { data, isLoading } = useSuspenseCallsData();

  const view = useMemo(() => {
    if (!data) return null;
    const start = periodStart(period);
    const events = data.events.filter((e) => inPeriod(e.created_at, start));
    const titles = new Map(data.calls.map((c) => [c.id, c.title]));
    const per = new Map<string, typeof events>();
    for (const e of events) {
      const group = per.get(e.call_id);
      if (group) group.push(e);
      else per.set(e.call_id, [e]);
    }
    const top = data.calls
      .map((c) => ({ c, s: summarize(per.get(c.id) ?? []) }))
      .filter((x) => x.s.opened > 0)
      .sort((a, b) => b.s.opened - a.s.opened)
      .slice(0, 5);
    return {
      created: data.calls.filter((c) => inPeriod(c.created_at, start)).length,
      totals: summarize(events),
      series: dailySeries(events, start),
      top,
      recent: events.slice(0, 8).map((e) => ({ ...e, title: titles.get(e.call_id) ?? "Chamada" })),
    };
  }, [data, period]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Visão geral</h2>
          <p className="text-sm text-muted-foreground">Como suas chamadas estão performando.</p>
        </div>
        <ToggleGroup type="single" value={period} onValueChange={(v) => v && setPeriod(v as Period)} className="rounded-xl border bg-card p-1">
          {PERIODS.map((p) => <ToggleGroupItem key={p.v} value={p.v} className="h-8 rounded-lg px-3 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{p.l}</ToggleGroupItem>)}
        </ToggleGroup>
      </div>

      {isLoading || !view ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
          <StatCard icon={PhoneCall} label="Chamadas criadas" value={view.created} />
          <StatCard icon={Eye} label="Aberturas" value={view.totals.opened} />
          <StatCard icon={CheckCircle2} label="Atendidas" value={view.totals.answered} tone="success" />
          <StatCard icon={PhoneOff} label="Recusadas" value={view.totals.declined} tone="danger" />
          <StatCard icon={Percent} label="Taxa de atendimento" value={`${view.totals.rate}%`} tone="success" />
          <StatCard icon={Clock} label="Duração média" value={formatDuration(view.totals.avgDuration)} tone="muted" />
        </div>
      )}

      <section className="rounded-2xl border bg-card p-5 shadow-card">
        <h3 className="mb-4 font-semibold">Aberturas x atendidas por dia</h3>
        {isLoading || !view ? <Skeleton className="h-64 rounded-xl" /> : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={view.series} margin={{ left: -20, right: 8, top: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--popover-foreground)" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="opened" name="Aberturas" stroke="var(--admin-blue)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="answered" name="Atendidas" stroke="var(--admin-green)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5 shadow-card">
          <h3 className="mb-4 flex items-center gap-2 font-semibold"><Trophy className="h-4 w-4 text-primary" /> Chamadas com melhor desempenho</h3>
          {isLoading || !view ? <Skeleton className="h-40 rounded-xl" /> : !view.top.length ? (
            <EmptyState icon={Trophy} title="Sem dados no período" text="Envie o link de uma chamada para ver o ranking aqui." action={<Button asChild size="sm"><Link to="/admin/new"><Plus className="h-4 w-4" /> Nova chamada</Link></Button>} />
          ) : (
            <ol className="space-y-2">
              {view.top.map(({ c, s }, i) => (
                <li key={c.id}>
                  <Link to="/admin/chamadas/$id" params={{ id: c.id }} className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted">
                    <span className="w-5 text-center text-sm font-semibold text-muted-foreground">{i + 1}</span>
                    <img src={c.person_photo_url ?? undefined} alt="" className="h-9 w-9 rounded-full bg-muted object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{c.title}</div>
                      <div className="truncate text-xs text-muted-foreground">{c.person_name}</div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="font-semibold tabular-nums">{s.opened} aberturas</div>
                      <div className="text-admin-green">{s.rate}% atendidas</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>
        <section className="rounded-2xl border bg-card p-5 shadow-card">
          <h3 className="mb-4 flex items-center gap-2 font-semibold"><Activity className="h-4 w-4 text-primary" /> Atividade recente</h3>
          {isLoading || !view ? <Skeleton className="h-40 rounded-xl" /> : !view.recent.length ? (
            <EmptyState icon={Activity} title="Nenhuma atividade" text="Quando alguém abrir uma chamada, aparece aqui." />
          ) : (
            <ul className="divide-y">
              {view.recent.map((e, i) => (
                <li key={i} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${e.event === "answered" ? "bg-admin-green" : e.event === "declined" ? "bg-destructive" : "bg-primary"}`} />
                  <span className="min-w-0 flex-1 truncate"><b className="font-medium">{e.title}</b> {EVENT_LABEL[e.event] ?? e.event}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(e.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
