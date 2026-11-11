import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/admin/components/AdminShell";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ links: [{ rel: "icon", type: "image/svg+xml", href: "/admin-favicon.svg" }] }),
  component: AdminShell,
});
