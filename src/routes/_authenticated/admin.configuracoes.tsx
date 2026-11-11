import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/admin/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — CallSim" },
      { name: "description", content: "Perfil, preferências e exportação de dados." },
      { property: "og:title", content: "Configurações — CallSim" },
      { property: "og:description", content: "Perfil, preferências e exportação de dados." },
    ],
  }),
  component: () => <ComingSoon title="Configurações" text="Perfil, preferências e exportação de dados. Esta área chega na próxima etapa." />,
});
