import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CallExperience } from "@/components/call/CallExperience";
import type { PublicCall } from "@/lib/calls";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: async () => ({ error: null }) },
}));

function call(theme: unknown): PublicCall {
  return {
    id: "c1",
    slug: "abc123",
    video_url: "https://example.com/v.mp4",
    video_type: "mp4",
    person_name: "Ana Souza",
    person_photo_url: null,
    background_url: null,
    subtitle: "Chamada de vídeo",
    ringtone_type: "preset",
    ringtone_value: "classic",
    vibrate: false,
    fullscreen_video: false,
    unmute_button: true,
    is_active: true,
    theme,
  } as unknown as PublicCall;
}

afterEach(cleanup);

describe("Public call themes", () => {
  it("shows the Telegram screen when no theme is stored", async () => {
    render(<CallExperience call={call(undefined)} track={false} />);
    expect(await screen.findByText("chamando...")).toBeInTheDocument();
    expect(screen.queryByText("Chamada de vídeo do WhatsApp")).toBeNull();
  });

  it("shows the WhatsApp screen when the call stores whatsapp", async () => {
    render(<CallExperience call={call("whatsapp")} track={false} />);
    expect(await screen.findByText("Chamada de vídeo do WhatsApp")).toBeInTheDocument();
    expect(screen.getByText("tocando...")).toBeInTheDocument();
    expect(screen.queryByText("chamando...")).toBeNull();
  });

  it("shows the Messenger screen when the call stores messenger", async () => {
    render(<CallExperience call={call("messenger")} track={false} />);
    expect(await screen.findByText("Chamada de vídeo do Messenger")).toBeInTheDocument();
  });

  it("falls back to Telegram for an unknown theme", async () => {
    render(<CallExperience call={call("discord")} track={false} />);
    expect(await screen.findByText("chamando...")).toBeInTheDocument();
  });

  it("uses the theme's own wording on the declined screen", async () => {
    render(<CallExperience call={call("whatsapp")} track={false} />);
    fireEvent.click(await screen.findByLabelText("Recusar"));
    expect(await screen.findByText("Chamada recusada")).toBeInTheDocument();
    expect(screen.getByText("Ligar de volta")).toBeInTheDocument();
  });
});
