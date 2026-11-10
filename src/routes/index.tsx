import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
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
