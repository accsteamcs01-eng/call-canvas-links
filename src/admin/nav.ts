import { BookImage, LayoutDashboard, PhoneCall, Settings, Users } from "lucide-react";

export const NAV = [
  { title: "Dashboard", to: "/admin", icon: LayoutDashboard },
  { title: "Chamadas", to: "/admin/chamadas", icon: PhoneCall },
  { title: "Biblioteca", to: "/admin/biblioteca", icon: BookImage },
  { title: "Contatos", to: "/admin/contatos", icon: Users },
  { title: "Configurações", to: "/admin/configuracoes", icon: Settings },
] as const;

export function pageTitle(path: string) {
  if (path === "/admin/new") return "Nova chamada";
  const hit = [...NAV].reverse().find((n) => path === n.to || path.startsWith(n.to + "/"));
  if (hit && hit.to !== "/admin") return hit.title;
  if (/^\/admin\/[^/]+$/.test(path) && path !== "/admin") return "Editar chamada";
  return "Dashboard";
}

export const isActivePath = (path: string, to: string) =>
  to === "/admin" ? path === "/admin" || path === "/admin/" : path === to || path.startsWith(to + "/");
