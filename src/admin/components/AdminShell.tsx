import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { LogOut, Moon, Plus, Search, Sun, UserRound } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { NAV, isActivePath, pageTitle } from "../nav";
import { useAdminTheme } from "../theme";
import { useCallsData, useUserEmail } from "../data";
import { Logo, LogoIcon } from "./Logo";

function usePath() {
  return useRouterState({ select: (s) => s.location.pathname.replace(/\/$/, "") || "/" });
}

function useSignOut() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
}

function AppSidebar() {
  const path = usePath();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { data: email } = useUserEmail();
  const signOut = useSignOut();
  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="h-14 justify-center px-3">
        <Link to="/admin">{collapsed ? <LogoIcon className="h-7 w-7" /> : <Logo />}</Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {NAV.map((n) => (
                <SidebarMenuItem key={n.to}>
                  <SidebarMenuButton asChild isActive={isActivePath(path, n.to)} tooltip={n.title} className="h-9 data-[active=true]:bg-primary/15 data-[active=true]:text-primary">
                    <Link to={n.to}><n.icon className="h-4 w-4" /><span>{n.title}</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-2">
        {!collapsed && <p className="truncate px-2 pt-1 text-xs text-muted-foreground">{email}</p>}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} tooltip="Sair"><LogOut className="h-4 w-4" /><span>Sair</span></SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function GlobalSearch({ open, setOpen }: { open: boolean; setOpen: (o: boolean) => void }) {
  const navigate = useNavigate();
  const { data } = useCallsData();
  const go = (fn: () => void) => { setOpen(false); fn(); };
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar páginas e chamadas..." />
      <CommandList>
        <CommandEmpty>Nada encontrado.</CommandEmpty>
        <CommandGroup heading="Páginas">
          {NAV.map((n) => (
            <CommandItem key={n.to} onSelect={() => go(() => navigate({ to: n.to }))}><n.icon className="h-4 w-4" />{n.title}</CommandItem>
          ))}
          <CommandItem onSelect={() => go(() => navigate({ to: "/admin/new" }))}><Plus className="h-4 w-4" />Nova chamada</CommandItem>
        </CommandGroup>
        {!!data?.calls.length && (
          <CommandGroup heading="Chamadas">
            {data.calls.map((c) => (
              <CommandItem key={c.id} value={`${c.title} ${c.person_name} ${c.id}`} onSelect={() => go(() => navigate({ to: "/admin/$id", params: { id: c.id } }))}>
                <span className="truncate">{c.title}</span>
                <span className="ml-auto truncate text-xs text-muted-foreground">{c.person_name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

function Topbar({ onSearch, theme, toggleTheme }: { onSearch: () => void; theme: string; toggleTheme: () => void }) {
  const path = usePath();
  const { data: email } = useUserEmail();
  const signOut = useSignOut();
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur">
      <SidebarTrigger className="hidden md:inline-flex" />
      <LogoIcon className="h-7 w-7 md:hidden" />
      <h1 className="truncate text-base font-semibold">{pageTitle(path)}</h1>
      <div className="ml-auto flex items-center gap-2">
        <button onClick={onSearch} className="hidden h-9 w-64 items-center gap-2 rounded-lg border bg-card px-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 sm:flex">
          <Search className="h-4 w-4" /> Buscar...
          <kbd className="ml-auto rounded border bg-muted px-1.5 text-[10px]">Ctrl K</kbd>
        </button>
        <Button variant="ghost" size="icon" className="sm:hidden" onClick={onSearch} aria-label="Buscar"><Search className="h-4 w-4" /></Button>
        <Button asChild size="sm">
          <Link to="/admin/new"><Plus className="h-4 w-4" /><span className="hidden sm:inline">Nova chamada</span></Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Menu do usuário"><UserRound className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} Tema {theme === "dark" ? "claro" : "escuro"}
            </DropdownMenuItem>
            <DropdownMenuItem asChild><Link to="/admin/configuracoes">Configurações</Link></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}><LogOut className="h-4 w-4" /> Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function BottomNav() {
  const path = usePath();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {NAV.map((n) => {
        const active = isActivePath(path, n.to);
        return (
          <Link key={n.to} to={n.to} className={`flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}>
            <n.icon className="h-5 w-5" />{n.title}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell() {
  const { theme, toggle } = useAdminTheme();
  const [search, setSearch] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearch((s) => !s); }
    };
    window.addEventListener("keydown", onKey);
    // Inter is loaded only for the panel so the public call page keeps its fonts.
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
    return () => { window.removeEventListener("keydown", onKey); link.remove(); };
  }, []);
  return (
    <SidebarProvider>
      <div className="admin-root flex min-h-dvh w-full bg-background text-foreground">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onSearch={() => setSearch(true)} theme={theme} toggleTheme={toggle} />
          <main className="flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10"><Outlet /></main>
        </div>
        <BottomNav />
        <GlobalSearch open={search} setOpen={setSearch} />
      </div>
    </SidebarProvider>
  );
}
