import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { NORDEA_EASING } from "./easing";

export type NumberFormat = "currency-sek" | "percent" | "number" | "currency-eur";

interface CountingNumberProps {
  from?: number;
  to: number;
  startFrame: number;
  durationFrames?: number;
  format?: NumberFormat;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  fontFamily?: string;
  letterSpacing?: string | number;
}

export const CountingNumber: React.FC<CountingNumberProps> = ({
  from = 0,
  to,
  startFrame,
  durationFrames = 45,
  format = "number",
  fontSize = 96,
  fontWeight = 700,
  color = "#FFFFFF",
  decimals = 0,
  prefix = "",
  suffix = "",
  fontFamily = "NordeaSansSmall, Inter, system-ui, sans-serif",
  letterSpacing = "-0.02em",
}) => {
  const frame = useCurrentFrame();
  const localFrame = Math.max(0, frame - startFrame);

  const value = interpolate(localFrame, [0, durationFrames], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: NORDEA_EASING.easeOutExpo,
  });

  const opacity = interpolate(localFrame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: NORDEA_EASING.decelerate,
  });

  const formattedValue = formatNumber(value, format, decimals);

  return (
    <div
      style={{
        fontFamily,
        fontSize,
        fontWeight,
        color,
        opacity,
        // tabular nums = lika breda siffror, ingen "wobble" när siffran ändras
        fontVariantNumeric: "tabular-nums",
        letterSpacing,
      }}
    >
      {prefix}
      {formattedValue}
      {suffix}
    </div>
  );
};

function formatNumber(value: number, format: NumberFormat, decimals: number): string {
  switch (format) {
    case "currency-sek":
      return new Intl.NumberFormat("sv-SE", {
        style: "currency",
        currency: "SEK",
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value);

    case "currency-eur":
      return new Intl.NumberFormat("sv-SE", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value);

    case "percent":
      return new Intl.NumberFormat("sv-SE", {
        style: "percent",
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value / 100);

    case "number":
    default:
      return new Intl.NumberFormat("sv-SE", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value);
  }
}
