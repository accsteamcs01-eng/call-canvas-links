import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { NAV } from "../nav";
import { useCallsData } from "../data";

export default function GlobalSearch({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  const navigate = useNavigate();
  const { data } = useCallsData(open);
  const go = (fn: () => void) => { setOpen(false); fn(); };
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar páginas e chamadas..." />
      <CommandList>
        <CommandEmpty>Nada encontrado.</CommandEmpty>
        <CommandGroup heading="Páginas">
          {NAV.map((n) => <CommandItem key={n.to} onSelect={() => go(() => navigate({ to: n.to }))}><n.icon className="h-4 w-4" />{n.title}</CommandItem>)}
          <CommandItem onSelect={() => go(() => navigate({ to: "/admin/new" }))}><Plus className="h-4 w-4" />Nova chamada</CommandItem>
        </CommandGroup>
        {!!data?.calls.length && <CommandGroup heading="Chamadas">
          {data.calls.map((c) => <CommandItem key={c.id} value={`${c.title} ${c.person_name} ${c.id}`} onSelect={() => go(() => navigate({ to: "/admin/$id", params: { id: c.id } }))}>
            <span className="truncate">{c.title}</span><span className="ml-auto truncate text-xs text-muted-foreground">{c.person_name}</span>
          </CommandItem>)}
        </CommandGroup>}
      </CommandList>
    </CommandDialog>
  );
}