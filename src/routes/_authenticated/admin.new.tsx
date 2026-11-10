import { createFileRoute } from "@tanstack/react-router";
import { CallEditorPage } from "@/components/admin/CallEditorPage";

export const Route = createFileRoute("/_authenticated/admin/new")({
  head: () => ({
    meta: [
      { title: "Nova chamada — CallSim" },
      { name: "description", content: "Crie uma nova chamada de vídeo." },
      { property: "og:title", content: "Nova chamada — CallSim" },
      { property: "og:description", content: "Crie uma nova chamada de vídeo." },
    ],
  }),
  component: () => <CallEditorPage />,
});
