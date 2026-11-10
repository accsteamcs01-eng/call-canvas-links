import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CallEditorPage } from "@/components/admin/CallEditorPage";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/$id")({
  head: () => ({
    meta: [
      { title: "Editar chamada — CallSim" },
      { name: "description", content: "Edite sua chamada de vídeo." },
      { property: "og:title", content: "Editar chamada — CallSim" },
      { property: "og:description", content: "Edite sua chamada de vídeo." },
    ],
  }),
  component: EditPage,
});

function EditPage() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["call-edit", id],
    queryFn: async () => (await supabase.from("calls").select("*").eq("id", id).maybeSingle()).data,
  });
  if (isLoading) return <p className="p-8 text-muted-foreground">Carregando...</p>;
  if (!data) return <p className="p-8 text-muted-foreground">Chamada não encontrada.</p>;
  return <CallEditorPage initial={data} />;
}
