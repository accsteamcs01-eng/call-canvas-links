import { describe, expect, it } from "vitest";
import { previewImageError, resolveLinkPreview } from "./link-preview";

describe("link preview rules", () => {
  it("accepts images up to 300 KB and rejects larger ones", () => {
    expect(previewImageError({ size: 300 * 1024, type: "image/jpeg" })).toBeNull();
    expect(previewImageError({ size: 300 * 1024 + 1, type: "image/jpeg" })).not.toBeNull();
  });
  it("rejects non-image uploads", () => {
    expect(previewImageError({ size: 100, type: "video/mp4" })).not.toBeNull();
  });
  it("uses the person's photo when no preview image is set", () => {
    expect(resolveLinkPreview({ name: "Ana", photo: "photo.jpg", image: null, title: "", description: "" }).image).toBe("photo.jpg");
  });
  it("suggests the person's name in an empty title", () => {
    expect(resolveLinkPreview({ name: "Ana", photo: null, image: null, title: "  ", description: "" }).title).toBe("Ana está te ligando");
  });
  it("uses the default description when empty", () => {
    expect(resolveLinkPreview({ name: "Ana", photo: null, image: null, title: "", description: "" }).description).toBe("Chamada de vídeo • Toque para atender");
  });
  it("keeps custom preview values", () => {
    expect(resolveLinkPreview({ name: "Ana", photo: "photo.jpg", image: "preview.jpg", title: " Convite ", description: " Atenda " })).toEqual({ image: "preview.jpg", title: "Convite", description: "Atenda" });
  });
});