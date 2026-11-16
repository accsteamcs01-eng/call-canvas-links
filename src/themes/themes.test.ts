import { describe, expect, it } from "vitest";
import { resolveTheme } from "./index";

describe("resolveTheme", () => {
  it("defaults missing or unknown themes to telegram", () => {
    expect(resolveTheme(null)).toBe("telegram");
    expect(resolveTheme(undefined)).toBe("telegram");
    expect(resolveTheme("discord")).toBe("telegram");
  });
  it("keeps whatsapp and messenger", () => {
    expect(resolveTheme("whatsapp")).toBe("whatsapp");
    expect(resolveTheme("messenger")).toBe("messenger");
  });
});
