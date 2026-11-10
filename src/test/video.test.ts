import { describe, expect, it } from "vitest";
import { parseVideoInput } from "@/lib/video";

describe("parseVideoInput", () => {
  it("detects YouTube links", () => {
    expect(parseVideoInput("https://youtu.be/abc123XYZ")).toMatchObject({ type: "youtube", id: "abc123XYZ" });
  });
  it("detects Vimeo links", () => {
    expect(parseVideoInput("https://vimeo.com/76979871")).toMatchObject({ type: "vimeo", id: "76979871" });
  });
  it("detects direct mp4 and hls", () => {
    expect(parseVideoInput("https://x.com/a.mp4")?.type).toBe("mp4");
    expect(parseVideoInput("https://x.com/a.m3u8")?.isHls).toBe(true);
  });
  it("extracts src from pasted iframe code", () => {
    expect(parseVideoInput('<iframe src="https://www.youtube.com/embed/qwe987"></iframe>')).toMatchObject({ type: "youtube", id: "qwe987" });
    expect(parseVideoInput('<iframe src="https://player.other.com/v/1"></iframe>')?.type).toBe("iframe");
  });
});
