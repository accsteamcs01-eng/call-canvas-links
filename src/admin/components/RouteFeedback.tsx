import { useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminPending() {
  return <div aria-busy="true" aria-label="Carregando" className="space-y-5"><Skeleton className="h-12 w-64" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((id) => <Skeleton key={id} className="h-48" />)}</div></div>;
}

export function AdminLoadError() {
  const router = useRouter();
  return <div role="alert" className="space-y-3"><p>Não foi possível carregar os dados.</p><Button variant="outline" onClick={() => void router.invalidate()}>Tentar novamente</Button></div>;
}

export function AdminNotFound() {
  return <p className="text-muted-foreground">Página não encontrada.</p>;
}