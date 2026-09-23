// ── Juridisk text i videon ──
//
// Två saker som Nordeas annonser har och som ligger över scenerna:
//  - riskNote: en rad längst ned genom hela filmen ("Investeringar innebär en risk.")
//  - creditWarning: Konsumentverkets varning för konsumentkrediter i ett vitt
//    band nertill (vit yta, svart text, röd triangel)
// Villkor och räkneexempel är en egen scen (TermsScene).

import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { fonts } from "./styles";
import type { LegalConfig, VideoConfig } from "./types";

export const CREDIT_WARNING_TITLE = "Att låna kostar pengar!";
export const CREDIT_WARNING_BODY =
  "Om du inte kan betala tillbaka skulden i tid riskerar du en betalningsanmärkning. " +
  "Det kan leda till svårigheter att få hyra bostad, teckna abonnemang och få nya lån. " +
  "För stöd, vänd dig till budget- och skuldrådgivningen i din kommun. " +
  "Kontaktuppgifter finns på konsumentverket.se";

const WARNING_RED = "#911D26";
const FPS = 30;

// Bandets höjd i andel av bildhöjden, per format (uppmätt i annonserna).
const BAND_HEIGHT: Record<VideoConfig["format"], number> = {
  story: 0.2,
  vertical: 0.2,
  feed: 0.24,
  landscape: 0.26,
};

// Riskradens yta i andel av bildhöjden.
const RISK_NOTE_HEIGHT = 0.08;

/** Hur mycket av bildens nederkant scenerna ska lämna fri (px). */
export function legalReserve(legal: LegalConfig | undefined, format: VideoConfig["format"], height: number): number {
  if (!legal) return 0;
  let reserve = 0;
  if (legal.creditWarning) reserve += BAND_HEIGHT[format] * height;
  if (legal.riskNote) reserve += RISK_NOTE_HEIGHT * height;
  return Math.round(reserve);
}

const WarningTriangle: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size * 0.88} viewBox="0 0 100 88" style={{ flexShrink: 0, display: "block" }}>
    <path
      d="M50 6 L95 82 L5 82 Z"
      fill="none"
      stroke={WARNING_RED}
      strokeWidth={9}
      strokeLinejoin="round"
    />
    <rect x={45} y={30} width={10} height={30} rx={4} fill={WARNING_RED} />
    <circle cx={50} cy={70} r={6} fill={WARNING_RED} />
  </svg>
);

/**
 * Lagret med juridisk text. Ritas ovanpå scenerna men under loggan.
 * `textColor` = aktuell scens textfärg (för riskraden).
 */
export const LegalOverlay: React.FC<{
  legal: LegalConfig;
  format: VideoConfig["format"];
  width: number;
  height: number;
  textColor: string;
}> = ({ legal, format, width, height, textColor }) => {
  const frame = useCurrentFrame();
  const scale = width / 1080;
  const bandHeight = legal.creditWarning ? BAND_HEIGHT[format] * height : 0;
  const stacked = format === "story";

  const bandStart = Math.round((legal.creditWarning?.fromSeconds ?? 0) * FPS);
  const bandOpacity = interpolate(frame, [bandStart, bandStart + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const riskOpacity = interpolate(frame, [3, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <>
      {legal.riskNote && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: bandHeight,
            height: RISK_NOTE_HEIGHT * height,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: `0 ${80 * scale}px`,
            fontFamily: fonts.body,
            fontSize: Math.round(26 * scale),
            fontWeight: 400,
            color: textColor,
            textAlign: "center",
            opacity: riskOpacity,
            zIndex: 50,
          }}
        >
          {legal.riskNote}
        </div>
      )}
      {legal.creditWarning && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: bandHeight,
            backgroundColor: "#FFFFFF",
            display: "flex",
            flexDirection: stacked ? "column" : "row",
            alignItems: stacked ? "flex-start" : "center",
            justifyContent: "center",
            gap: (stacked ? 20 : 36) * scale,
            padding: `0 ${(stacked ? 70 : 110) * scale}px`,
            opacity: bandOpacity,
            zIndex: 50,
          }}
        >
          <WarningTriangle size={(stacked ? 70 : 84) * scale} />
          <div
            style={{
              fontFamily: fonts.body,
              fontSize: Math.round((stacked ? 24 : 20) * scale),
              lineHeight: 1.3,
              color: "#000000",
              textAlign: "left",
            }}
          >
            <div style={{ fontWeight: 700 }}>{CREDIT_WARNING_TITLE}</div>
            <div style={{ fontWeight: 400 }}>{CREDIT_WARNING_BODY}</div>
          </div>
        </div>
      )}
    </>
  );
};
