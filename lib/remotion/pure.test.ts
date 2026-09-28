import { describe, expect, it } from "vitest";
import { applyPatch, PatchError } from "./json-patch";
import { contrastRatio, luminance } from "./color";

describe("contrastRatio", () => {
  it("svart mot vitt är 21:1", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contrastRatio("#fff", "#000")).toBeCloseTo(21, 5);
  });

  it("vit text på Nordea-blått klarar WCAG AA (4,5:1)", () => {
    expect(contrastRatio("#FFFFFF", "#0000A0")!).toBeGreaterThan(4.5);
  });

  it("returnerar null för färger som inte går att tolka", () => {
    expect(luminance("blå")).toBeNull();
    expect(contrastRatio("#12", "#fff")).toBeNull();
  });
});

describe("applyPatch", () => {
  const doc = { scenes: [{ headline: "A" }, { headline: "B" }], format: "story" };

  it("ändrar en kopia och lämnar originalet orört", () => {
    const next = applyPatch(doc, [{ op: "replace", path: "/scenes/0/headline", value: "Ny" }]);
    expect(next.scenes[0].headline).toBe("Ny");
    expect(doc.scenes[0].headline).toBe("A");
  });

  it("stöder add, remove och move i listor", () => {
    const next = applyPatch(doc, [
      { op: "add", path: "/scenes/-", value: { headline: "C" } },
      { op: "move", from: "/scenes/0", path: "/scenes/-" },
      { op: "remove", path: "/scenes/0" },
    ]);
    expect(next.scenes.map((s) => s.headline)).toEqual(["C", "A"]);
  });

  it("avbryter hela patchen om ett test misslyckas", () => {
    expect(() =>
      applyPatch(doc, [
        { op: "replace", path: "/format", value: "feed" },
        { op: "test", path: "/scenes/0/headline", value: "fel" },
      ])
    ).toThrow(PatchError);
  });

  it("vägrar sökvägar som inte finns och index utanför listan", () => {
    expect(() => applyPatch(doc, [{ op: "replace", path: "/scenes/5/headline", value: "x" }])).toThrow(PatchError);
    expect(() => applyPatch(doc, [{ op: "remove", path: "/finnsinte" }])).toThrow(PatchError);
    expect(() => applyPatch(doc, [{ op: "replace", path: "", value: {} }])).toThrow(PatchError);
  });
});
