import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/admin/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/admin/contatos")({
  head: () => ({
    meta: [
      { title: "Contatos — CallSim" },
      { name: "description", content: "Pessoas salvas para reutilizar nas chamadas." },
      { property: "og:title", content: "Contatos — CallSim" },
      { property: "og:description", content: "Pessoas salvas para reutilizar nas chamadas." },
    ],
  }),
  component: () => <ComingSoon title="Contatos" text="Pessoas salvas para reutilizar nas chamadas. Esta área chega na próxima etapa." />,
});
