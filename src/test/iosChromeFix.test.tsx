import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRef } from "react";
import { createIosChromePlayback, isIosChrome, useIosChromeFix } from "@/lib/iosChromeFix";

const video = { type: "mp4" as const, url: "https://example.test/call.mp4" };
const chrome = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/140.0 Mobile/15E148 Safari/604.1";

describe("iOS Chrome browser boundary", () => {
  it("enables only CriOS on an iOS device", () => {
    expect(isIosChrome(chrome)).toBe(true);
    expect(isIosChrome(chrome.replace("iPhone", "iPad"))).toBe(true);
    expect(isIosChrome(chrome.replace("CriOS/140.0", "Version/18.0"))).toBe(false);
    expect(isIosChrome("Android Chrome/140.0")).toBe(false);
    expect(isIosChrome("Windows Chrome/140.0")).toBe(false);
    expect(isIosChrome("iPhone Messenger AppleWebKit")).toBe(false);
    expect(isIosChrome("iPhone Telegram AppleWebKit")).toBe(false);
    expect(isIosChrome("Android CriOS/140.0")).toBe(false);
  });

  it("does not create videos or change html outside iOS Chrome", () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("iPhone Version/18.0 Safari/604.1");
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    function Harness() {
      const root = useRef<HTMLDivElement>(null);
      const fix = useIosChromeFix(root, video, true);
      return <div ref={root}>{String(fix.playback === null)}</div>;
    }
    const result = render(<Harness />);
    expect(result.container.querySelector("video")).toBeNull();
    expect(document.documentElement.classList.contains("ios-chrome-call-fix")).toBe(false);
    expect(play).not.toHaveBeenCalled();
  });
});

describe("gesture and permission recovery", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
  });

  it("plays both persistent elements synchronously before permission work", () => {
    const calls: HTMLMediaElement[] = [];
    vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function (this: HTMLMediaElement) { calls.push(this); return Promise.resolve(); });
    const fix = createIosChromePlayback(video, vi.fn(), vi.fn());
    fix.prepare();
    expect(calls).toEqual([fix.main, fix.self]);
    expect(fix.self.muted).toBe(true);
    expect(fix.self.autoplay).toBe(true);
    expect(fix.self.playsInline).toBe(true);
    expect(fix.main?.hasAttribute("webkit-playsinline")).toBe(true);
    expect(fix.self.preload).toBe("auto");
    expect(fix.main?.controls).toBe(false);
    fix.dispose();
  });

  it("falls back to muted and retries a rejected play on the next touch", async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockRejectedValue(new DOMException("blocked", "NotAllowedError"));
    const muted = vi.fn();
    const error = vi.fn();
    const fix = createIosChromePlayback(video, muted, error);
    fix.prepare();
    await act(async () => { await Promise.resolve(); });
    expect(fix.main?.muted).toBe(true);
    expect(muted).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalledWith("main", expect.objectContaining({ name: "NotAllowedError" }));
    play.mockResolvedValue();
    const before = play.mock.calls.length;
    window.dispatchEvent(new Event("touchend"));
    expect(play.mock.calls.length).toBeGreaterThan(before);
    const after = play.mock.calls.length;
    window.dispatchEvent(new Event("click"));
    expect(play.mock.calls.length).toBe(after);
    fix.dispose();
  });

  it("attaches the camera, retries metadata, 300/800/1500ms, visibility and pageshow, then cleans up", () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    const fix = createIosChromePlayback(video, vi.fn(), vi.fn());
    fix.prepare();
    const stream = {} as MediaStream;
    fix.cameraReady(stream);
    expect(fix.self.srcObject).toBe(stream);
    play.mockClear();
    fix.self.dispatchEvent(new Event("loadedmetadata"));
    expect(play).toHaveBeenCalledTimes(1);
    play.mockClear();
    vi.advanceTimersByTime(300);
    expect(play).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(500);
    expect(play).toHaveBeenCalledTimes(4);
    vi.advanceTimersByTime(700);
    expect(play).toHaveBeenCalledTimes(6);
    window.dispatchEvent(new Event("pageshow"));
    document.dispatchEvent(new Event("visibilitychange"));
    expect(play).toHaveBeenCalledTimes(10);
    fix.dispose();
    play.mockClear();
    vi.runAllTimers();
    window.dispatchEvent(new Event("pageshow"));
    document.dispatchEvent(new Event("visibilitychange"));
    fix.self.dispatchEvent(new Event("loadedmetadata"));
    expect(play).not.toHaveBeenCalled();
  });

  it("continues main playback recovery when camera permission is denied", () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    const fix = createIosChromePlayback(video, vi.fn(), vi.fn());
    fix.prepare();
    play.mockClear();
    fix.cameraReady(null);
    expect(play).toHaveBeenCalledTimes(1);
    expect(fix.self.srcObject).toBeNull();
    fix.dispose();
  });
});

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });