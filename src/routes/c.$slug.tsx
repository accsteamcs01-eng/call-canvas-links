import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CallExperience } from "@/components/call/CallExperience";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/c/$slug")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({ preview: s["preview"] ? 1 : undefined }),
  head: () => ({
    meta: [
      { title: "Chamada de vídeo" },
      { name: "description", content: "Chamada de vídeo recebida" },
      { property: "og:title", content: "Chamada de vídeo" },
      { property: "og:description", content: "Você está recebendo uma chamada de vídeo." },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" },
      { name: "theme-color", content: "#000000" },
    ],
  }),
  component: CallPage,
});

function CallPage() {
  const { slug } = Route.useParams();
  const { preview } = Route.useSearch();
  const { data, isLoading } = useQuery({
    queryKey: ["call", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("calls").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="call-root fixed inset-0 flex justify-center overflow-hidden overscroll-none bg-call-black">
      <div className="relative h-dvh w-full max-w-[420px]">
        {isLoading ? null : data ? (
          <CallExperience call={data} track={!preview} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-8 text-center">
            <p className="text-[17px] font-medium">Chamada indisponível</p>
            <p className="mt-2 text-[14px] text-call-ink/60">Este link não existe ou expirou.</p>
          </div>
        )}
      </div>
    </div>
  );
}
