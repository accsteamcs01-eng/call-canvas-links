import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "CallSim — Painel" },
      { name: "description", content: "Crie e compartilhe chamadas de vídeo." },
      { property: "og:title", content: "CallSim" },
      { property: "og:description", content: "Crie e compartilhe chamadas de vídeo." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/admin" });
  },
});
