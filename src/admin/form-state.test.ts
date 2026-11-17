import { describe, expect, it } from "vitest";
import { formCompletion, hasUnsavedChanges } from "./form-state";

describe("Call form state", () => {
  it("warns for changes and clears after saving the current values", () => {
    const saved = JSON.stringify({ name: "Ana", vibrate: true, photo: null });
    const changed = JSON.stringify({ name: "Ana", vibrate: false, photo: null });
    expect(hasUnsavedChanges(changed, saved)).toBe(true);
    expect(hasUnsavedChanges(changed, changed)).toBe(false);
    expect(hasUnsavedChanges(saved, saved)).toBe(false);
  });
  it("does not require optional images or preview overrides for completion", () => {
    expect(formCompletion("Ana", true, "preset", "classic")).toBe(100);
    expect(formCompletion("", false, "preset", "classic")).toBe(33);
  });
  it("keeps the existing custom ringtone requirement", () => {
    expect(formCompletion("Ana", true, "custom", "classic")).toBe(67);
    expect(formCompletion("Ana", true, "custom", "https://example.org/ring.mp3")).toBe(100);
  });
});
