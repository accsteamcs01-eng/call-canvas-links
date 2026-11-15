import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { LogoIcon } from "@/admin/components/Logo";
import { BRAND_NAME } from "@/admin/brand";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Entrar — CallSim" },
      { name: "description", content: "Acesse o painel do CallSim." },
      { property: "og:title", content: "Entrar — CallSim" },
      { property: "og:description", content: "Acesse o painel do CallSim." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/admin" });
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/admin" } });
        if (error) throw error;
        if (data.session) navigate({ to: "/admin" });
        else toast.success("Conta criada! Confirme pelo link enviado ao seu e-mail.");
      }
    } catch (err) {
      toast.error((err as Error).message === "Invalid login credentials" ? "E-mail ou senha incorretos" : (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-root flex min-h-dvh items-center justify-center bg-[radial-gradient(ellipse_at_top,var(--accent),transparent_60%)] px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-2xl border bg-card p-7 shadow-card">
        <div className="text-center">
          <LogoIcon className="mx-auto mb-4 h-12 w-12" />
          <h1 className="text-2xl font-semibold tracking-tight">{BRAND_NAME}</h1>
          <p className="text-sm text-muted-foreground">{mode === "in" ? "Entre no seu painel" : "Crie sua conta de administrador"}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pw">Senha</Label>
          <Input id="pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {mode === "in" ? "Entrar" : "Criar conta"}
        </Button>
        <button type="button" className="w-full text-center text-sm text-muted-foreground hover:text-foreground" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "Não tem conta? Criar conta" : "Já tem conta? Entrar"}
        </button>
      </form>
    </div>
  );
}
