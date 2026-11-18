import { describe, expect, it } from "vitest";
import { contactFields, contactUsage } from "./contacts";

describe("Saved contacts", () => {
  it("copies name, profile photo and default subtitle into the call draft", () => {
    expect(
      contactFields({
        id: "ana",
        name: "Ana",
        photo_url: "https://example.org/ana.jpg",
        subtitle: "Chamada da Ana",
      }),
    ).toEqual({
      contact_id: "ana",
      person_name: "Ana",
      person_photo_url: "https://example.org/ana.jpg",
      subtitle: "Chamada da Ana",
    });
  });
  it("clears the previous photo when the selected contact has none", () => {
    expect(
      contactFields({ id: "bia", name: "Bia", photo_url: null, subtitle: "Chamada de vídeo" })
        .person_photo_url,
    ).toBeNull();
  });
  it("counts calls by saved contact rather than matching names", () => {
    expect(
      contactUsage([
        { contact_id: "ana" },
        { contact_id: null },
        { contact_id: "ana" },
        { contact_id: "bia" },
      ]),
    ).toEqual({ ana: 2, bia: 1 });
  });
});
