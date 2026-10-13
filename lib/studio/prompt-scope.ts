export type PromptScope = "video" | "scene";
export function editPrompt(text: string, scope: PromptScope, selectedScene: number | null, sceneCount: number): string {
  if (scope === "scene" && selectedScene !== null && selectedScene >= 0 && selectedScene < sceneCount) {
    return `${text}\n\nOmfattning: endast scen ${selectedScene + 1}. Behåll övriga scener oförändrade.`;
  }
  return `${text}\n\nOmfattning: hela videon som en sammanhängande film. En markering i editorn begränsar inte ändringen till en scen.`;
}
