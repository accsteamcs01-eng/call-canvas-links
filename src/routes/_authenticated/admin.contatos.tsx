import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Search, Trash2, UserRound, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { contactsQueryOptions, contactUsageQueryOptions, type Contact } from "@/admin/contacts";
import { ContactEditor } from "@/admin/components/ContactEditor";
import { ConfirmDialog } from "@/admin/components/ConfirmDialog";
import { EmptyState } from "@/admin/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/contatos")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(contactsQueryOptions),
      context.queryClient.ensureQueryData(contactUsageQueryOptions),
    ]),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Contatos — CallSim" },
      { name: "description", content: "Pessoas salvas para reutilizar nas chamadas." },
      { property: "og:title", content: "Contatos — CallSim" },
      { property: "og:description", content: "Pessoas salvas para reutilizar nas chamadas." },
    ],
  }),
  component: ContactsPage,
});

function ContactsPage() {
  const qc = useQueryClient();
  const { data: contacts } = useSuspenseQuery(contactsQueryOptions);
  const { data: usage } = useSuspenseQuery(contactUsageQueryOptions);
  const [q, setQ] = useState("");
  const [editor, setEditor] = useState<{ contact: Contact | null } | null>(null);
  const [remove, setRemove] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState(false);
  const term = q.trim().toLocaleLowerCase("pt-BR");
  const rows = contacts.filter((c) => c.name.toLocaleLowerCase("pt-BR").includes(term));

  async function deleteContact() {
    if (!remove || deleting) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("contacts").delete().eq("id", remove.id);
      if (error) throw error;
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["contacts"] }),
        qc.invalidateQueries({ queryKey: ["contact-usage"] }),
        qc.invalidateQueries({ queryKey: ["calls"] }),
        qc.invalidateQueries({ queryKey: ["call-edit"] }),
      ]);
      setRemove(null);
      toast.success("Contato excluído; chamadas preservadas");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-xl font-semibold">Contatos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {contacts.length} {contacts.length === 1 ? "pessoa salva" : "pessoas salvas"}
          </p>
        </div>
        <Button onClick={() => setEditor({ contact: null })}>
          <Plus className="h-4 w-4" />
          Novo contato
        </Button>
      </div>
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Buscar contatos"
          className="pl-9"
          placeholder="Buscar por nome..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {!rows.length ? (
        <EmptyState
          icon={Users}
          title={q ? "Nenhum contato encontrado" : "Nenhum contato salvo"}
          text={q ? "Tente outro nome." : "Sua lista de contatos está vazia."}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((contact) => (
            <article
              key={contact.id}
              className="flex min-w-0 flex-col rounded-lg border bg-card p-5 shadow-card"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-muted">
                  {contact.photo_url ? (
                    <img
                      src={contact.photo_url}
                      alt={contact.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserRound className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="break-words font-semibold">{contact.name}</h2>
                  <p className="mt-1 break-words text-sm text-muted-foreground">
                    {contact.subtitle}
                  </p>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-2 border-t pt-3">
                <span className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{usage[contact.id] ?? 0}</span>{" "}
                  {(usage[contact.id] ?? 0) === 1 ? "chamada" : "chamadas"}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto h-8 w-8"
                  aria-label={`Editar ${contact.name}`}
                  title="Editar contato"
                  onClick={() => setEditor({ contact })}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  aria-label={`Excluir ${contact.name}`}
                  title="Excluir contato"
                  disabled={deleting}
                  onClick={() => setRemove(contact)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
      {editor && <ContactEditor contact={editor.contact} onClose={() => setEditor(null)} />}
      <ConfirmDialog
        open={!!remove}
        title={`Excluir ${remove?.name ?? "contato"}?`}
        text="O contato será removido da sua lista. As chamadas existentes manterão o nome, a foto e o subtítulo atuais."
        onConfirm={() => void deleteContact()}
        onClose={() => {
          if (!deleting) setRemove(null);
        }}
      />
    </div>
  );
}
