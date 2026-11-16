import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ActiveCall } from "@/components/call/ActiveCall";
import { CallExperience } from "@/components/call/CallExperience";
import { isStalled, shouldLeaveConnecting } from "@/lib/callLoading";
import type { PublicCall } from "@/lib/calls";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: async () => ({ error: null }) },
}));

function call(over: Partial<PublicCall> = {}): PublicCall {
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
    theme: "telegram",
    ...over,
  } as unknown as PublicCall;
}

const video = { type: "mp4" as const, url: "https://example.com/v.mp4" };

const activeCall = () => (
  <ActiveCall name="Ana Souza" video={video} stream={null} showUnmuteButton onFlipCamera={async () => null} onEnd={() => {}} />
);

afterEach(cleanup);

describe("connecting gate", () => {
  it("leaves the screen only once the video is ready and at least 1.2s passed", () => {
    expect(shouldLeaveConnecting(2000, true)).toBe(true);
    expect(shouldLeaveConnecting(1200, true)).toBe(true);
    expect(shouldLeaveConnecting(1199, true)).toBe(false);
    expect(shouldLeaveConnecting(5000, false)).toBe(false);
  });

  it("never waits longer than 10s, ready or not", () => {
    expect(shouldLeaveConnecting(9999, false)).toBe(false);
    expect(shouldLeaveConnecting(10000, false)).toBe(true);
  });

  it("counts a frozen clock as buffering only while the video is playing", () => {
    expect(isStalled(5000, 4000, false)).toBe(true);
    expect(isStalled(5000, 4400, false)).toBe(false);
    expect(isStalled(5000, 4000, true)).toBe(false);
  });

  it("holds the connecting screen while the video is not buffered", async () => {
    render(<CallExperience call={call()} track={false} />);
    fireEvent.click(await screen.findByRole("button", { name: "Atender" }));
    expect(await screen.findByText("Conectando...")).toBeInTheDocument();
    await new Promise((r) => setTimeout(r, 1500));
    expect(screen.getByText("Conectando...")).toBeInTheDocument();
  });

  it("enters the call as soon as the video reports it can play", async () => {
    const { container } = render(<CallExperience call={call()} track={false} />);
    fireEvent.click(await screen.findByRole("button", { name: "Atender" }));
    await screen.findByText("Conectando...");
    const warm = container.querySelector('[data-testid="warm-video"]');
    expect(warm).not.toBeNull();
    fireEvent(warm!, new Event("canplay"));
    await waitFor(() => expect(screen.queryByText("Conectando...")).toBeNull(), { timeout: 4000 });
  });
});

describe("buffering indicator", () => {
  it("appears after a stall and disappears when playback resumes", async () => {
    const { container } = render(activeCall());
    const el = container.querySelector("video");
    expect(el).not.toBeNull();
    expect(screen.queryByLabelText("Carregando vídeo")).toBeNull();
    fireEvent(el!, new Event("waiting"));
    await waitFor(() => expect(screen.getByLabelText("Carregando vídeo")).toBeInTheDocument(), { timeout: 1500 });
    fireEvent(el!, new Event("playing"));
    await waitFor(() => expect(screen.queryByLabelText("Carregando vídeo")).toBeNull(), { timeout: 1500 });
  });
});

describe("video problem", () => {
  it("offers to reload the source instead of a black screen", async () => {
    const { container } = render(activeCall());
    const el = container.querySelector("video");
    expect(el).not.toBeNull();
    fireEvent(el!, new Event("error"));
    expect(await screen.findByText("Conexão instável…")).toBeInTheDocument();
    const retry = await screen.findByText("Tentar novamente");
    fireEvent.click(retry);
    await waitFor(() => expect(screen.queryByText("Tentar novamente")).toBeNull(), { timeout: 1500 });
    expect(container.querySelector("video")).not.toBeNull();
  });
});
