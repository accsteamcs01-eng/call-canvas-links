import { createFileRoute } from "@tanstack/react-router";
import { CallEditorPage } from "@/components/admin/CallEditorPage";

export const Route = createFileRoute("/_authenticated/admin/new")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Nova chamada — CallSim" },
      { name: "description", content: "Crie uma nova chamada de vídeo." },
      { property: "og:title", content: "Nova chamada — CallSim" },
      { property: "og:description", content: "Crie uma nova chamada de vídeo." },
    ],
  }),
  component: () => <CallEditorPage />,
});
