// ── Kan den här servern rendera video? ──
//
// Export av MP4 (Motion Studio, Master och Massproduktion) går via
// lib/production/worker.ts, som renderar lokalt med Remotion: den kräver
// Chromium, skrivbar disk och en process som lever kvar efter svaret.
// Vercel har inget av det, och Lambda-vägen är inte byggd för arbetaren.
//
// Routes frågar här INNAN de skapar jobb, så att exporten ger ett begripligt
// besked direkt i stället för ett jobb som tyst aldrig blir klart.

export type RenderAvailability = { available: true } | { available: false; reason: string };

type Env = Record<string, string | undefined>;

export function videoExportAvailability(env: Env = process.env): RenderAvailability {
  const backend = (env.RENDER_BACKEND || "local").toLowerCase();

  if (backend === "disabled") {
    return {
      available: false,
      reason: "Videoexport är avstängd i den här miljön. Förhandsvisningen fungerar, men MP4-filer skapas inte här.",
    };
  }
  if (backend === "lambda") {
    return {
      available: false,
      reason:
        "Videoexport via AWS Lambda är inte byggd ännu. Exportera från en installation med lokal rendering (RENDER_BACKEND=local).",
    };
  }
  if (env.VERCEL) {
    return {
      available: false,
      reason:
        "Videoexport kräver en server med Chromium och skrivbar disk, vilket Vercel saknar. Exportera från en installation som kör lokalt.",
    };
  }
  return { available: true };
}

/** Standardsvar för export-routes när rendering inte går att köra här. */
export function renderUnavailableBody(reason: string) {
  return { error: reason, message: reason, code: "render_unavailable" as const };
}
