"use client";

import { useEffect, useState } from "react";

interface NordeaLogoProps {
  /**
   * Color variant. 'white' = the negative (white) logo for dark surfaces,
   * 'dark' = the standard blue/black logo for light surfaces.
   */
  variant?: "dark" | "white";
  /** Logo height in pixels. Default 32. */
  size?: number;
  /** Show "CreativeIQ" subbrand alongside the logo. Default false. */
  withProductName?: boolean;
  className?: string;
}

/**
 * Resolves the logo file in priority order. The PNG asset
 * (/images/nordea-logo-neg.png) is the only one shipped today; SVG paths
 * are kept as a forward-looking preference that auto-takes-effect once the
 * brand team drops them in.
 */
function getCandidates(variant: "dark" | "white"): string[] {
  if (variant === "white") {
    return [
      "/images/nordea-logo-white.svg",
      "/images/nordea-logo-neg.png",
      "/brand/nordea-logo-white.svg",
    ];
  }
  return [
    "/images/nordea-logo.svg",
    "/images/nordea-logo.png",
    "/brand/nordea-logo.svg",
  ];
}

export function NordeaLogo({
  variant = "dark",
  size = 32,
  withProductName = false,
  className = "",
}: NordeaLogoProps) {
  const [resolvedSrc, setResolvedSrc] = useState<string | null | "checking">("checking");

  useEffect(() => {
    let cancelled = false;
    const candidates = getCandidates(variant);

    const tryNext = (idx: number) => {
      if (cancelled) return;
      if (idx >= candidates.length) {
        setResolvedSrc(null);
        return;
      }
      const img = new Image();
      img.onload = () => !cancelled && setResolvedSrc(candidates[idx]);
      img.onerror = () => tryNext(idx + 1);
      img.src = candidates[idx];
    };

    setResolvedSrc("checking");
    tryNext(0);

    return () => {
      cancelled = true;
    };
  }, [variant]);

  // Layout: optional product name sits to the right of the logo with a
  // thin vertical divider, sized proportionally to the logo height.
  const productNameNode = withProductName ? (
    <>
      <div
        style={{
          width: 1,
          height: size * 0.7,
          background:
            variant === "white" ? "rgba(255,255,255,0.20)" : "rgba(0,0,94,0.20)",
        }}
      />
      <span
        style={{
          fontFamily: "var(--font-sans)",
          fontWeight: 500,
          fontSize: Math.round(size * 0.5),
          color: variant === "white" ? "rgba(255,255,255,0.85)" : "#00005E",
          letterSpacing: "-0.01em",
        }}
      >
        CreativeIQ
      </span>
    </>
  ) : null;

  // Pre-resolution placeholder so we don't flash a wrong-color fallback
  if (resolvedSrc === "checking") {
    return (
      <div
        className={`flex items-center gap-3 ${className}`}
        style={{ height: size }}
      >
        <div style={{ width: size * 2, height: size }} />
        {productNameNode}
      </div>
    );
  }

  // Image asset resolved
  if (resolvedSrc) {
    return (
      <div className={`flex items-center gap-3 ${className}`} style={{ height: size }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolvedSrc}
          alt="Nordea"
          style={{ height: size, width: "auto", display: "block" }}
        />
        {productNameNode}
      </div>
    );
  }

  // Final fallback: "N + Nordea" text lockup matches DynamicVideo's
  // LogoOverlay so the brand reads consistently across UI and renders.
  const isWhite = variant === "white";
  return (
    <div className={`flex items-center gap-3 ${className}`} style={{ height: size }}>
      <div
        className="flex items-center gap-2"
        style={{ height: size }}
      >
        <div
          style={{
            width: size,
            height: size,
            borderRadius: size * 0.28,
            background: isWhite ? "rgba(255,255,255,0.15)" : "#0000A0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-display)",
            fontSize: size * 0.55,
            fontWeight: 900,
            color: "#ffffff",
          }}
        >
          N
        </div>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: size * 0.6,
            fontWeight: 700,
            color: isWhite ? "#ffffff" : "#0000A0",
            letterSpacing: "-0.01em",
          }}
        >
          Nordea
        </span>
      </div>
      {productNameNode}
    </div>
  );
}
