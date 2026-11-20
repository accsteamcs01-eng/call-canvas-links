import { describe, expect, it } from "vitest";
import { mediaUsage, urlMatchesFile } from "./library";

const url = "https://x.co/storage/v1/object/sign/photos/u1/a.jpg?token=abc";

describe("media library usage", () => {
  it("matches the exact bucket and file", () => {
    expect(urlMatchesFile(url, "photos", "u1/a.jpg")).toBe(true);
    expect(urlMatchesFile(url, "backgrounds", "u1/a.jpg")).toBe(false);
    expect(urlMatchesFile(url, "photos", "u1/b.jpg")).toBe(false);
  });
  it("counts every reference to a file", () => {
    const u = mediaUsage([{ bucket: "photos", path: "u1/a.jpg" }, { bucket: "videos", path: "u1/v.mp4" }], [url, url, null]);
    expect(u).toEqual({ "photos/u1/a.jpg": 2, "videos/u1/v.mp4": 0 });
  });
});
