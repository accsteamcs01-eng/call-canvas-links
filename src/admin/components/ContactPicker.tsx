import { useQuery } from "@tanstack/react-query";
import { contactsQueryOptions, type Contact } from "@/admin/contacts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UserRound } from "lucide-react";

export function ContactPicker({
  value,
  onSelect,
  onDetach,
}: {
  value: string | null;
  onSelect: (contact: Contact) => void;
  onDetach: () => void;
}) {
  const { data = [], isPending, error, refetch } = useQuery(contactsQueryOptions);
  if (error)
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        Não foi possível carregar contatos.
        <Button type="button" variant="ghost" size="sm" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  return (
    <Select
      value={value ?? "manual"}
      onValueChange={(id) => {
        if (id === "manual") return onDetach();
        const contact = data.find((c) => c.id === id);
        if (contact) onSelect(contact);
      }}
      disabled={isPending}
    >
      <SelectTrigger aria-label="Contato salvo">
        <SelectValue placeholder="Selecionar contato" />
      </SelectTrigger>
      <SelectContent className="admin-root">
        <SelectItem value="manual">Preenchimento manual</SelectItem>
        {data.map((contact) => (
          <SelectItem key={contact.id} value={contact.id}>
            <span className="flex items-center gap-2">
              {contact.photo_url ? (
                <img src={contact.photo_url} alt="" className="h-6 w-6 rounded-full object-cover" />
              ) : (
                <UserRound className="h-5 w-5 text-muted-foreground" />
              )}
              {contact.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
