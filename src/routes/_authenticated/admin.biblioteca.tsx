import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/admin/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/admin/biblioteca")({
  head: () => ({
    meta: [
      { title: "Biblioteca — CallSim" },
      { name: "description", content: "Fotos, capas, toques e vídeos enviados." },
      { property: "og:title", content: "Biblioteca — CallSim" },
      { property: "og:description", content: "Fotos, capas, toques e vídeos enviados." },
    ],
  }),
  component: () => <ComingSoon title="Biblioteca" text="Fotos, capas, toques e vídeos enviados. Esta área chega na próxima etapa." />,
});
