import { expect, it } from "vitest";
import { draftChoices } from "./draft-choices";
it("keeps explicit format choices independent of channel words in the idea", () => {
  expect(draftChoices("Instagram-annons. Format: 4:5. Längd: 30 sekunder.")).toEqual({ format: "vertical", duration: 30 });
});
it("leaves free-text briefs without structured choices alone", () => {
  expect(draftChoices("En lugn film om sparande")).toEqual({ format: undefined, duration: undefined });
});
