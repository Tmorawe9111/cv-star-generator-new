import { describe, it, expect } from "vitest";
import { mapFormDataToCVData } from "@/components/cv-layouts/mapFormDataToCVData";
import type { CVFormData } from "@/contexts/CVFormContext";

describe("CV Generator - mapFormDataToCVData", () => {
  it("maps basic personal data to CV format", () => {
    const formData: CVFormData = {
      vorname: "Max",
      nachname: "Mustermann",
      email: "max@example.com",
      telefon: "+49 123 456789",
      ort: "Berlin",
      strasse: "Hauptstraße",
      hausnummer: "1",
      plz: "10115",
    };

    const result = mapFormDataToCVData(formData);

    expect(result.vorname).toBe("Max");
    expect(result.nachname).toBe("Mustermann");
    expect(result.email).toBe("max@example.com");
    expect(result.telefon).toBe("+49 123 456789");
    expect(result.ort).toBe("Berlin");
    expect(result.strasse).toBe("Hauptstraße");
    expect(result.hausnummer).toBe("1");
    expect(result.plz).toBe("10115");
  });

  it("maps ueberMich and falls back to bio", () => {
    const formDataWithBio: CVFormData = {
      bio: "Fallback bio text",
    };
    const resultBio = mapFormDataToCVData(formDataWithBio);
    expect(resultBio.ueberMich).toBe("Fallback bio text");

    const formDataWithUeberMich: CVFormData = {
      ueberMich: "Primary about text",
      bio: "Ignored bio",
    };
    const resultUeberMich = mapFormDataToCVData(formDataWithUeberMich);
    expect(resultUeberMich.ueberMich).toBe("Primary about text");
  });

  it("maps and sorts berufserfahrung chronologically", () => {
    const formData: CVFormData = {
      berufserfahrung: [
        {
          titel: "Junior Dev",
          unternehmen: "Old Corp",
          ort: "Berlin",
          zeitraum_von: "2020-01",
          zeitraum_bis: "2022-12",
          beschreibung: "",
        },
        {
          titel: "Senior Dev",
          unternehmen: "New Corp",
          ort: "Munich",
          zeitraum_von: "2023-01",
          zeitraum_bis: "heute",
          beschreibung: "",
        },
      ],
    };

    const result = mapFormDataToCVData(formData);

    expect(result.berufserfahrung).toHaveLength(2);
    // Current job ("heute") should come first
    expect(result.berufserfahrung![0].titel).toBe("Senior Dev");
    expect(result.berufserfahrung![0].zeitraum_bis).toBe("heute");
    expect(result.berufserfahrung![1].titel).toBe("Junior Dev");
  });

  it("handles empty form data gracefully", () => {
    const formData: CVFormData = {};
    const result = mapFormDataToCVData(formData);

    expect(result.schulbildung).toEqual([]);
    expect(result.berufserfahrung).toEqual([]);
    expect(result.sprachen).toEqual([]);
    expect(result.faehigkeiten).toEqual([]);
    expect(result.qualifikationen).toEqual([]);
    expect(result.zertifikate).toEqual([]);
    expect(result.weiterbildung).toEqual([]);
    expect(result.interessen).toEqual([]);
  });
});
