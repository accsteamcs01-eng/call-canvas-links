import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Contact, Download, FolderOpen, LogOut, PhoneCall, PhoneOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ThemePicker } from "@/admin/components/ThemePicker";
import { StatCard } from "@/admin/components/StatCard";
import { useCallsData } from "@/admin/data";
import { contactsQueryOptions, contactUsageQueryOptions } from "@/admin/contacts";
import { libraryQueryOptions } from "@/admin/library";
import { summarize } from "@/admin/metrics";
import { downloadCsv, loadDefaults, saveDefaults, toCsv, type CallDefaults } from "@/admin/settings";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Configurações — CallSim" },
      { name: "description", content: "Conta, preferências padrão e exportação de dados." },
      { property: "og:title", content: "Configurações — CallSim" },
      { property: "og:description", content: "Conta, preferências padrão e exportação de dados." },
    ],
  }),
  component: SettingsPage,
});

const day = () => new Date().toISOString().slice(0, 10);

function SettingsPage() {
  const me = useQuery({
    queryKey: ["me-full"],
    queryFn: async () => (await supabase.auth.getSession()).data.session?.user ?? null,
  });
  const calls = useCallsData();
  const contacts = useQuery(contactsQueryOptions);
  const usage = useQuery(contactUsageQueryOptions);
  const library = useQuery(libraryQueryOptions);

  const [defaults, setDefaults] = useState<CallDefaults>(loadDefaults);
  useEffect(() => saveDefaults(defaults), [defaults]);
  const set = (p: Partial<CallDefaults>) => setDefaults((d) => ({ ...d, ...p }));

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [saving, setSaving] = useState(false);
  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return void toast.error("A senha precisa ter pelo menos 8 caracteres.");
    if (pw !== pw2) return void toast.error("As senhas não conferem.");
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setSaving(false);
    if (error) return void toast.error(error.message);
    setPw(""); setPw2("");
    toast.success("Senha alterada.");
  }

  const list = calls.data?.calls ?? [];
  const events = calls.data?.events ?? [];
  const active = list.filter((c) => c.is_active).length;
  const files = library.data?.length ?? 0;

  function exportCalls() {
    const rows = list.map((c) => {
      const s = summarize(events.filter((e) => e.call_id === c.id));
      return [c.title ?? "", c.person_name, c.slug, c.theme, c.is_active ? "ativa" : "inativa",
        new Date(c.created_at).toLocaleString("pt-BR"), s.opened, s.answered, s.declined,
        `${Math.round(s.rate)}%`, Math.round(s.avgDuration)];
    });
    downloadCsv(toCsv(["Título","Pessoa","Slug","Tema","Status","Criada em","Acessos","Atendidas","Recusadas","Taxa de atendimento","Duração média (s)"], rows), `chamadas-${day()}.csv`);
  }
  function exportEvents() {
    const byId = new Map(list.map((c) => [c.id, c.person_name]));
    downloadCsv(toCsv(["Chamada","Evento","Duração (s)","Data"],
      events.map((e) => [byId.get(e.call_id) ?? e.call_id, e.event, e.duration_seconds ?? "", new Date(e.created_at).toLocaleString("pt-BR")])), `eventos-${day()}.csv`);
  }
  function exportContacts() {
    downloadCsv(toCsv(["Nome","Subtítulo","Chamadas vinculadas","Criado em"],
      (contacts.data ?? []).map((c) => [c.name, c.subtitle ?? "", usage.data?.[c.id] ?? 0, new Date(c.created_at).toLocaleString("pt-BR")])), `contatos-${day()}.csv`);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={PhoneCall} tone="success" label="Chamadas ativas" value={active} />
        <StatCard icon={PhoneOff} tone="muted" label="Chamadas inativas" value={list.length - active} />
        <StatCard icon={Contact} label="Contatos" value={contacts.data?.length ?? 0} />
        <StatCard icon={FolderOpen} label="Arquivos" value={files} />
      </div>

      <Card>
        <CardHeader><CardTitle>Conta</CardTitle>
          <CardDescription>{me.data?.email}{me.data?.created_at ? ` · desde ${new Date(me.data.created_at).toLocaleDateString("pt-BR")}` : ""}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={changePassword} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div className="space-y-1.5"><Label htmlFor="pw">Nova senha</Label><Input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" /></div>
            <div className="space-y-1.5"><Label htmlFor="pw2">Confirmar senha</Label><Input id="pw2" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" /></div>
            <Button type="submit" disabled={saving || !pw}>Alterar senha</Button>
          </form>
          <Button variant="outline" className="mt-4" onClick={() => supabase.auth.signOut()}><LogOut className="mr-2 h-4 w-4" />Sair da conta</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Padrões para novas chamadas</CardTitle>
          <CardDescription>Aplicados automaticamente ao criar uma chamada. Salvo neste navegador.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <ThemePicker value={defaults.theme} onChange={(theme) => set({ theme })} />
          {([["vibrate","Vibrar o celular ao tocar"],["fullscreen","Vídeo em tela cheia"],["unmute","Mostrar botão de ativar som"]] as const).map(([k, label]) => (
            <label key={k} className="flex items-center justify-between gap-3 text-sm">
              {label}<Switch checked={defaults[k]} onCheckedChange={(v) => set({ [k]: v })} />
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Exportar dados</CardTitle><CardDescription>Arquivos CSV que abrem no Excel ou Google Planilhas.</CardDescription></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportCalls} disabled={!calls.data}><Download className="mr-2 h-4 w-4" />Chamadas e métricas</Button>
          <Button variant="outline" onClick={exportEvents} disabled={!calls.data}><Download className="mr-2 h-4 w-4" />Eventos</Button>
          <Button variant="outline" onClick={exportContacts} disabled={!contacts.data}><Download className="mr-2 h-4 w-4" />Contatos</Button>
        </CardContent>
      </Card>
    </div>
  );
}
