import { Link, Outlet, useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { lazy, Suspense, useEffect, useState } from "react";
import { LogOut, Moon, Plus, Search, Sun, UserRound } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { NAV, isActivePath, pageTitle } from "../nav";
import { useAdminTheme } from "../theme";
import { useUserEmail } from "../data";
import { Logo, LogoIcon } from "./Logo";

const GlobalSearch = lazy(() => import("./GlobalSearch"));

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
        <Button variant="outline" onClick={onSearch} className="hidden h-9 w-64 justify-start gap-2 bg-card px-3 text-sm font-normal text-muted-foreground sm:flex">
          <Search className="h-4 w-4" /> Buscar...
          <kbd className="ml-auto rounded border bg-muted px-1.5 text-[10px]">Ctrl K</kbd>
        </Button>
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
  const router = useRouter();
  const { theme, toggle } = useAdminTheme();
  const [search, setSearch] = useState(false);
  useEffect(() => {
    let cancelled = false;
    // Warm common screens after the current screen paints, not all storage buckets.
    const warm = async () => {
      for (const to of ["/admin", "/admin/chamadas", "/admin/new"] as const) {
        if (cancelled) return;
        await router.preloadRoute({ to }).catch(() => undefined);
      }
    };
    const timer = window.setTimeout(() => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(() => { if (!cancelled) void warm(); }, { timeout: 3000 });
      } else {
        void warm();
      }
    }, 500);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [router]);
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
        {search && <Suspense fallback={null}><GlobalSearch open={search} setOpen={setSearch} /></Suspense>}
      </div>
    </SidebarProvider>
  );
}
