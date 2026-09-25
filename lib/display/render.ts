// ── Rendering av displaypaketet (server, lokal Remotion) ──
//
// Varje format renderas som stillbild via kompositionen NordeaDisplay.
// PNG först (skarpast för text och platta färger); blir filen tyngre än
// formatets maxvikt provas JPEG med sjunkande kvalitet. Klarar ingen nivå
// vikten levereras den lättaste och flaggas.

import { previewBackend } from "@/lib/remotion/preview-frames";
import { findDisplayFormat, deliveryFileName, type DisplayFormatSpec } from "@/lib/formats/registry";
import { layoutDisplay } from "./layout";
import { lintDisplay, type DisplayIssue } from "./lint";
import { resolveContent, type DisplaySet } from "./types";

const FPS = 30;
const JPEG_QUALITIES = [92, 85, 78, 70, 60];

export interface RenderedBanner {
  formatId: string;
  spec: DisplayFormatSpec;
  fileName: string;
  mime: "image/png" | "image/jpeg";
  bytes: number;
  withinLimit: boolean;
  issues: DisplayIssue[];
  buffer: Buffer;
}

export class DisplayRenderUnavailable extends Error {}

let browserPromise: Promise<unknown> | null = null;

/**
 * Klientens kompilerade kod körs aldrig här: illustrationen kompileras om
 * från källkoden (med samma spärrlista som i Motion Studio).
 */
export async function recompileIllustration(set: DisplaySet): Promise<DisplaySet> {
  const ill = set.content.illustration;
  if (!ill) return set;
  const { compileCanvasTsx } = await import("@/lib/remotion/compile");
  const result = await compileCanvasTsx(ill.tsxCode ?? "");
  return {
    ...set,
    content: {
      ...set.content,
      illustration: result.ok && result.compiledJs ? { ...ill, compiledJs: result.compiledJs } : null,
    },
  };
}

export async function renderDisplaySet(input: DisplaySet, onlyFormats?: string[]): Promise<RenderedBanner[]> {
  if (previewBackend() !== "local") {
    throw new DisplayRenderUnavailable(
      "Displaybanners renderas med lokal Remotion — den här miljön saknar renderare (t.ex. Vercel). Kör lokalt eller på en server med Chromium."
    );
  }
  const { getBundle } = await import("@/lib/remotion/render");
  const { renderStill, selectComposition, openBrowser, ensureBrowser } = await import("@remotion/renderer");
  await ensureBrowser();
  const serveUrl = await getBundle();
  if (!browserPromise) browserPromise = openBrowser("chrome");
  const browser = (await browserPromise) as Awaited<ReturnType<typeof openBrowser>>;
  const set = await recompileIllustration(input);

  const ids = (onlyFormats ?? set.formats).filter((id) => set.formats.includes(id));
  const out: RenderedBanner[] = [];
  try {
    for (const id of ids) {
      const spec = findDisplayFormat(id);
      if (!spec) continue;
      const content = resolveContent(set.content, set.overrides[id]);
      const layout = layoutDisplay(spec.width, spec.height, content, spec.family);
      const issues = lintDisplay(spec, content, layout);
      const inputProps = { content, width: spec.width, height: spec.height, family: spec.family };
      const composition = await selectComposition({ serveUrl, id: "NordeaDisplay", inputProps, puppeteerInstance: browser });
      const frame = Math.min(composition.durationInFrames - 1, Math.round((content.illustration?.atSeconds ?? 0) * FPS));
      const maxBytes = spec.maxKb * 1024;

      const still = async (imageFormat: "png" | "jpeg", jpegQuality?: number) => {
        const { buffer } = await renderStill({
          composition,
          serveUrl,
          inputProps,
          frame,
          imageFormat,
          jpegQuality,
          puppeteerInstance: browser,
        });
        if (!buffer) throw new Error(`Tom bild för ${spec.id}`);
        return Buffer.from(buffer);
      };

      let buffer = await still("png");
      let mime: RenderedBanner["mime"] = "image/png";
      if (buffer.length > maxBytes) {
        for (const q of JPEG_QUALITIES) {
          const jpg = await still("jpeg", q);
          if (jpg.length < buffer.length) {
            buffer = jpg;
            mime = "image/jpeg";
          }
          if (jpg.length <= maxBytes) break;
        }
      }
      const withinLimit = buffer.length <= maxBytes;
      if (!withinLimit) {
        issues.push({
          severity: "error",
          message: `Filen blir ${Math.round(buffer.length / 1024)} kB — över maxvikten ${spec.maxKb} kB`,
        });
      }
      out.push({
        formatId: id,
        spec,
        fileName: deliveryFileName(set.name, spec, mime === "image/png" ? "png" : "jpg"),
        mime,
        bytes: buffer.length,
        withinLimit,
        issues,
        buffer,
      });
    }
  } catch (err) {
    browserPromise = null;
    throw err;
  }
  return out;
}
