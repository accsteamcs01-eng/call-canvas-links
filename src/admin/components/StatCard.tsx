import type { LucideIcon } from "lucide-react";

export function StatCard({ icon: Icon, label, value, tone = "primary" }: { icon: LucideIcon; label: string; value: string | number; tone?: "primary" | "success" | "danger" | "muted" }) {
  const tones = { primary: "bg-primary/10 text-primary", success: "bg-admin-green/15 text-admin-green", danger: "bg-destructive/10 text-destructive", muted: "bg-muted text-muted-foreground" };
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-card transition-colors hover:border-primary/40">
      <div className={`mb-3 grid h-9 w-9 place-items-center rounded-xl ${tones[tone]}`}><Icon className="h-4 w-4" /></div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
