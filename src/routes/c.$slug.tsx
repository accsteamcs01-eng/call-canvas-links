import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CallExperience } from "@/components/call/CallExperience";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/c/$slug")({
  // data-only: server reads the share fields so WhatsApp/Telegram see them; the call UI still renders client-side.
  ssr: "data-only",
  loader: async ({ params }) => {
    const { data, error } = await supabase.rpc("get_public_call", { call_slug: params.slug }).maybeSingle();
    if (error) throw new Error("Chamada indisponível");
    return { share: data ? {
      person_name: data.person_name,
      person_photo_url: data.person_photo_url,
      preview_image_url: data.preview_image_url,
      preview_title: data.preview_title,
      preview_description: data.preview_description,
    } : null };
  },
  validateSearch: (s: Record<string, unknown>) => ({ preview: s["preview"] ? 1 : undefined }),
  head: ({ loaderData }) => {
    const c = loaderData?.share;
    const title = c?.preview_title?.trim() || (c ? `${c.person_name?.trim() || "Alguém"} está te ligando` : "Chamada de vídeo");
    const description = c?.preview_description?.trim() || "Chamada de vídeo • Toque para atender";
    const image = c?.preview_image_url || c?.person_photo_url || null;
    return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
      ...(image ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : []),
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" },
      { name: "theme-color", content: "#000000" },
    ],
    };
  },
  component: CallPage,
  errorComponent: CallUnavailable,
  notFoundComponent: CallUnavailable,
});

function CallPage() {
  const { slug } = Route.useParams();
  const { preview } = Route.useSearch();
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["call", slug],
    // Recheck availability on every visit, even when this slug is cached.
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_call", { call_slug: slug }).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="call-root fixed inset-0 flex justify-center overflow-hidden overscroll-none bg-call-black">
      <div className="relative h-dvh w-full max-w-[420px]">
        {isLoading || isFetching ? null : data?.is_active === true ? (
          <CallExperience call={data} track={!preview} />
        ) : (
          <CallUnavailable />
        )}
      </div>
    </div>
  );
}

function CallUnavailable() {
  return (
    <div className="call-root fixed inset-0 flex flex-col items-center justify-center bg-call-black px-8 text-center">
      <p className="text-[17px] font-medium">Chamada indisponível</p>
      <p className="mt-2 text-[14px] text-call-ink/60">Este link não existe ou expirou.</p>
    </div>
  );
}
