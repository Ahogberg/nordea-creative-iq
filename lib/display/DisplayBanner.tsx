// ── En displaybanner, renderad från innehåll + layout ──
//
// Används både som Remotion-komposition (NordeaDisplay → renderStill för
// leverans) och i webbläsaren via @remotion/player Thumbnail. Illustrationen
// är samma canvas-kod som i videon, ritad i sin designskala och centrerad i
// bannerns illustrationsyta — den stillbild som visas är tidpunkten
// `atSeconds` i scenen.

import React, { useMemo } from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { colors, fonts, LOGO_ASPECT } from "@/lib/remotion/styles";
import { themeFor, SceneThemeContext } from "@/lib/remotion/theme";
import { RichText } from "@/lib/remotion/rich-text";
import { CREDIT_WARNING_BODY, CREDIT_WARNING_TITLE, WarningTriangle } from "@/lib/remotion/legal";
import { LayersContext } from "@/lib/remotion/layers";
import { CanvasErrorBoundary, compileCanvasComponent, NO_INSETS } from "@/lib/remotion/scenes/CanvasScene";
import type { DisplayFamily } from "@/lib/formats/registry";
import { HEADLINE_LINE, SUBLINE_LINE, layoutDisplay, type Box } from "./layout";
import type { DisplayContent, DisplayIllustration } from "./types";

export interface DisplayBannerProps {
  content: DisplayContent;
  width: number;
  height: number;
  family?: DisplayFamily;
  /** Rita layoutens rutor ovanpå (felsökning i gränssnittet). */
  showBoxes?: boolean;
  [key: string]: unknown;
}

const abs = (b: Box): React.CSSProperties => ({ position: "absolute", left: b.x, top: b.y, width: b.w, height: b.h });

const CTA_COLOR = colors.teal;

export const DisplayBanner: React.FC<DisplayBannerProps> = ({ content, width, height, family, showBoxes }) => {
  const layout = useMemo(() => layoutDisplay(width, height, content, family), [width, height, content, family]);
  const theme = themeFor(content.background, content.headlineColor);

  return (
    <SceneThemeContext.Provider value={theme}>
      <AbsoluteFill style={{ backgroundColor: content.background, overflow: "hidden" }}>
        <div style={abs(layout.logo)}>
          <Wordmark color={theme.text} />
        </div>

        {layout.illustration && content.illustration && (
          <div style={{ ...abs(layout.illustration), overflow: "hidden" }}>
            <Illustration illustration={content.illustration} box={layout.illustration} />
          </div>
        )}

        <div style={{ ...abs(layout.text), textAlign: layout.align }}>
          <RichText
            as="div"
            text={content.headline}
            style={{
              fontFamily: fonts.headline,
              fontWeight: 700,
              fontSize: layout.headline.size,
              lineHeight: HEADLINE_LINE,
              color: theme.headline,
              letterSpacing: "-0.01em",
            }}
          />
          {layout.subline && content.subline && (
            <RichText
              as="div"
              text={content.subline}
              style={{
                fontFamily: fonts.body,
                fontWeight: 400,
                fontSize: layout.subline.size,
                lineHeight: SUBLINE_LINE,
                color: theme.textSecondary,
                marginTop: layout.sublineGap,
              }}
            />
          )}
        </div>

        {layout.cta && content.cta && (
          <div
            style={{
              ...abs(layout.cta.box),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 999,
              backgroundColor: CTA_COLOR,
              color: "#FFFFFF",
              fontFamily: fonts.body,
              fontWeight: 500,
              fontSize: layout.cta.fontSize,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            {content.cta}
          </div>
        )}

        {layout.riskNote && content.legal?.riskNote && (
          <div
            style={{
              ...abs(layout.riskNote.box),
              display: "flex",
              alignItems: "center",
              justifyContent: layout.align === "center" ? "center" : "flex-start",
              paddingLeft: layout.align === "center" ? 0 : layout.text.x,
              fontFamily: fonts.body,
              fontSize: layout.riskNote.size,
              color: theme.textSecondary,
              boxSizing: "border-box",
            }}
          >
            {content.legal.riskNote}
          </div>
        )}

        {layout.creditBand && (
          <div
            style={{
              ...abs(layout.creditBand.box),
              backgroundColor: "#FFFFFF",
              padding: layout.creditBand.padding,
              boxSizing: "border-box",
              display: "flex",
              gap: 6,
              alignItems: "flex-start",
              color: "#000000",
              fontFamily: fonts.body,
              overflow: "hidden",
            }}
          >
            <WarningTriangle size={layout.creditBand.triangle} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: layout.creditBand.titleSize, lineHeight: 1.2 }}>
                {CREDIT_WARNING_TITLE}
              </div>
              <div style={{ fontSize: layout.creditBand.bodySize, lineHeight: 1.25 }}>{CREDIT_WARNING_BODY}</div>
            </div>
          </div>
        )}

        {showBoxes && <LayoutBoxes boxes={[layout.logo, layout.illustration, layout.text, layout.cta?.box ?? null]} />}
      </AbsoluteFill>
    </SceneThemeContext.Provider>
  );
};

/** Ordmärket som mask, så att samma fil blir vit på blått och blå på ljust. */
const Wordmark: React.FC<{ color: string }> = ({ color }) => {
  const src = staticFile("images/nordea-logo-neg.png");
  const mask = `url("${src}") center / contain no-repeat`;
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: `${LOGO_ASPECT}` }}>
      <Img src={src} style={{ position: "absolute", width: 1, height: 1, opacity: 0 }} />
      <div style={{ position: "absolute", inset: 0, backgroundColor: color, WebkitMask: mask, mask }} />
    </div>
  );
};

const Illustration: React.FC<{ illustration: DisplayIllustration; box: Box }> = ({ illustration, box }) => {
  const Component = useMemo(() => compileCanvasComponent(illustration.compiledJs), [illustration.compiledJs]);
  // Illustrationen ritas i videons designskala och passas in i ytan.
  const scale = Math.min(box.w / illustration.designWidth, box.h / illustration.designHeight);
  const w = illustration.designWidth * scale;
  const h = illustration.designHeight * scale;
  const layers = useMemo(() => ({ layers: illustration.layers ?? [], scale }), [illustration.layers, scale]);
  if (!Component) return null;
  return (
    <div style={{ position: "absolute", left: (box.w - w) / 2, top: (box.h - h) / 2, width: w, height: h }}>
      <CanvasErrorBoundary scale={scale}>
        <LayersContext.Provider value={layers}>
          {/* Komponenten kommer ur AI-koden och memoiseras per kodsträng — som i CanvasScene. */}
          {/* eslint-disable-next-line react-hooks/static-components */}
          <Component width={w} height={h} scale={scale} safe={NO_INSETS} />
        </LayersContext.Provider>
      </CanvasErrorBoundary>
    </div>
  );
};

const LayoutBoxes: React.FC<{ boxes: Array<Box | null> }> = ({ boxes }) => (
  <>
    {boxes.map((b, i) =>
      b ? <div key={i} style={{ ...abs(b), outline: "1px dashed rgba(255,0,128,0.8)", pointerEvents: "none" }} /> : null
    )}
  </>
);
