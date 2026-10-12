import { describe, expect, it } from "vitest";
import { editPrompt } from "./prompt-scope";
import { useStudioStore } from "./store";
describe("whole video workflow", () => {
  it("starts empty with scene editing collapsed", () => {
    const state = useStudioStore.getState();
    expect(state.config.scenes).toEqual([]);
    expect(state.promptScope).toBe("video");
    expect(state.scenesOpen).toBe(false);
    expect(state.editorMode).toBe("basic");
  });
  it("does not constrain a video prompt when a scene is selected", () => {
    const prompt = editPrompt("Korta ned filmen", "video", 2, 4);
    expect(prompt).toContain("hela videon");
    expect(prompt).not.toContain("endast scen 3");
  });
  it("explicitly constrains a scene edit and preserves the rest", () => {
    expect(editPrompt("Ändra rubriken", "scene", 1, 3)).toContain("endast scen 2. Behåll övriga scener oförändrade");
  });
  it("falls back to the whole video if the scene was removed", () => {
    expect(editPrompt("Förbättra", "scene", 4, 2)).toContain("hela videon");
  });
});
