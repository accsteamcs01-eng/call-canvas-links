import { describe, expect, it } from "vitest";
import { parseDefaults, toCsv } from "./settings";

describe("settings", () => {
  it("falls back to telegram and enabled options", () => {
    expect(parseDefaults(null)).toEqual({ theme: "telegram", vibrate: true, fullscreen: true, unmute: true });
    expect(parseDefaults("{bad")).toEqual({ theme: "telegram", vibrate: true, fullscreen: true, unmute: true });
  });
  it("keeps saved choices", () => {
    expect(parseDefaults('{"theme":"whatsapp","vibrate":false}').theme).toBe("whatsapp");
    expect(parseDefaults('{"theme":"whatsapp","vibrate":false}').vibrate).toBe(false);
  });
  it("escapes csv cells", () => {
    expect(toCsv(["a", "b"], [['x;y', 'q"z']])).toBe('\uFEFFa;b\r\n"x;y";"q""z"');
  });
});
