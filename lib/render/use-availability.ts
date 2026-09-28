"use client";

// Frågar servern en gång om videoexport fungerar här (/api/render/status).
// null = svaret har inte kommit än; då visas inget och knappen är aktiv —
// själva exportanropet ger samma besked om det skulle behövas.

import { useEffect, useState } from "react";
import type { RenderAvailability } from "./availability";

let cached: Promise<RenderAvailability | null> | null = null;

function load(): Promise<RenderAvailability | null> {
  if (!cached) {
    cached = fetch("/api/render/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => (body?.video as RenderAvailability | undefined) ?? null)
      .catch(() => null);
  }
  return cached;
}

export function useVideoExportAvailability(): RenderAvailability | null {
  const [state, setState] = useState<RenderAvailability | null>(null);
  useEffect(() => {
    let cancelled = false;
    load().then((v) => {
      if (!cancelled) setState(v);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return state;
}
