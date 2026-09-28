"use client";

// Bygger HTML5-banners för alla format i webbläsaren — en version för
// förhandsvisning (filer från webbplatsen) och en för paketet (relativa
// sökvägar). Byggs om när innehållet ändras, lite fördröjt.

import { useEffect, useState } from "react";
import type { DisplayFormatSpec } from "@/lib/formats/registry";
import { layoutDisplay } from "../layout";
import { resolveContent, type DisplaySet } from "../types";
import { buildHtml5Banner, HTML5_ASSET_ALLOWLIST, LOGO, type Html5Banner, type Html5Target } from "./build";
import { renderStaticIllustration } from "./illustration";

// Typsnitt och logga som data-URL:er, hämtade en gång per sidvisning.
let assetsPromise: Promise<Record<string, string>> | null = null;

function loadEmbeddedAssets(): Promise<Record<string, string>> {
  if (!assetsPromise) {
    assetsPromise = Promise.all(
      HTML5_ASSET_ALLOWLIST.map(async (a) => {
        const blob = await fetch(a.publicPath).then((r) => {
          if (!r.ok) throw new Error(`${a.publicPath}: ${r.status}`);
          return r.blob();
        });
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const fr = new FileReader();
          fr.onload = () => resolve(String(fr.result));
          fr.onerror = () => reject(fr.error);
          fr.readAsDataURL(blob);
        });
        return [a.publicPath, dataUrl] as const;
      })
    )
      .then((pairs) => Object.fromEntries(pairs))
      .catch((err) => {
        assetsPromise = null;
        throw err;
      });
  }
  return assetsPromise;
}

export interface Html5Pair {
  preview: Html5Banner;
  pkg: Html5Banner;
}

export function useHtml5Banners(
  set: DisplaySet | null,
  specs: DisplayFormatSpec[],
  target: Html5Target,
  clickUrl: string,
  enabled: boolean
): { banners: Record<string, Html5Pair>; building: boolean } {
  const [banners, setBanners] = useState<Record<string, Html5Pair>>({});
  const [building, setBuilding] = useState(false);

  useEffect(() => {
    if (!enabled || !set) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setBuilding(true);
      const embedded = await loadEmbeddedAssets().catch(() => ({}) as Record<string, string>);
      const logoOnly: Record<string, string> = embedded[LOGO.publicPath] ? { [LOGO.publicPath]: embedded[LOGO.publicPath] } : {};
      const out: Record<string, Html5Pair> = {};
      for (const spec of specs) {
        const content = resolveContent(set.content, set.overrides[spec.id]);
        const layout = layoutDisplay(spec.width, spec.height, content, spec.family);
        const illustration =
          content.illustration && layout.illustration
            ? await renderStaticIllustration(content.illustration, layout.illustration, spec)
            : null;
        if (cancelled) return;
        const base = { target, clickUrl, illustration, motionLayers: content.illustration?.layers, title: `Nordea – ${set.name}` };
        out[spec.id] = {
          preview: buildHtml5Banner(content, spec, { ...base, assets: "preview", embedded }),
          pkg: buildHtml5Banner(content, spec, { ...base, assets: "package", embedded: logoOnly }),
        };
      }
      if (!cancelled) {
        setBanners(out);
        setBuilding(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [set, specs, target, clickUrl, enabled]);

  return { banners, building };
}
