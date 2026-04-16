import React, { useEffect, useState } from "react";
import { AbsoluteFill, useCurrentFrame, delayRender, continueRender } from "remotion";
import { Lottie, LottieAnimationData } from "@remotion/lottie";
import { fadeSlideUp, fadeIn } from "../utils";
import { colors, fonts } from "../styles";
import { getLottieUrl } from "../lottie-library";
import type { LottieScene as LottieSceneProps } from "../types";

export const LottieSceneComponent: React.FC<{
  scene: LottieSceneProps;
  width: number;
}> = ({ scene, width }) => {
  const frame = useCurrentFrame();
  const scale = width / 1080;

  const url = scene.animationUrl || getLottieUrl(scene.animationId);
  const sizePercent = scene.sizePercent ?? 60;
  const position = scene.position ?? "center";
  const loop = scene.loop ?? true;
  const playbackSpeed = scene.playbackSpeed ?? 1;

  const [handle] = useState(() => delayRender("Loading Lottie animation"));
  const [animationData, setAnimationData] = useState<LottieAnimationData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setLoadError("Ingen animation-URL angiven");
      continueRender(handle);
      return;
    }

    let cancelled = false;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setAnimationData(data);
        continueRender(handle);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err.message || "Kunde inte ladda animation");
        // Continue render so the video doesn't hang on a bad URL
        continueRender(handle);
      });

    return () => {
      cancelled = true;
    };
  }, [url, handle]);

  const containerAnim = fadeSlideUp(frame, 4, 18, 40);
  const headlineAnim = fadeSlideUp(frame, 12, 15, 30);
  const captionOpacity = fadeIn(frame, 22, 18);

  const animationSize = (width * sizePercent) / 100;

  const justifyContent =
    position === "top" ? "flex-start" : position === "bottom" ? "flex-end" : "center";

  return (
    <AbsoluteFill
      style={{
        backgroundColor: scene.background || "transparent",
        display: "flex",
        flexDirection: "column",
        justifyContent,
        alignItems: "center",
        padding: `${140 * scale}px ${90 * scale}px`,
        gap: 40 * scale,
      }}
    >
      {/* Animation */}
      <div
        style={{
          width: animationSize,
          height: animationSize,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...containerAnim,
        }}
      >
        {animationData ? (
          <Lottie
            animationData={animationData}
            loop={loop}
            playbackRate={playbackSpeed}
            style={{ width: "100%", height: "100%" }}
          />
        ) : loadError ? (
          <LottieFallback size={animationSize} error={loadError} scale={scale} />
        ) : (
          <LottieSkeleton size={animationSize} scale={scale} />
        )}
      </div>

      {/* Headline */}
      {scene.headline && (
        <h2
          style={{
            fontFamily: fonts.headline,
            fontSize: Math.round(56 * scale),
            fontWeight: 900,
            color: colors.white,
            lineHeight: 1.15,
            textAlign: "center",
            margin: 0,
            maxWidth: width * 0.82,
            ...headlineAnim,
          }}
        >
          {scene.headline}
        </h2>
      )}

      {/* Caption */}
      {scene.caption && (
        <p
          style={{
            fontFamily: fonts.body,
            fontSize: Math.round(26 * scale),
            fontWeight: 400,
            color: colors.dimText,
            textAlign: "center",
            margin: 0,
            maxWidth: width * 0.8,
            opacity: captionOpacity,
          }}
        >
          {scene.caption}
        </p>
      )}
    </AbsoluteFill>
  );
};

// ── Fallback: shown when Lottie fails to load ──
const LottieFallback: React.FC<{ size: number; error: string; scale: number }> = ({
  size,
  error,
  scale,
}) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 20 * scale,
        border: `${3 * scale}px dashed ${colors.divider}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 40 * scale,
        gap: 16 * scale,
      }}
    >
      <div
        style={{
          fontSize: Math.round(72 * scale),
          lineHeight: 1,
        }}
      >
        🎬
      </div>
      <span
        style={{
          fontFamily: fonts.body,
          fontSize: Math.round(18 * scale),
          color: colors.dimText,
          textAlign: "center",
        }}
      >
        Animation saknas
      </span>
      <span
        style={{
          fontFamily: fonts.body,
          fontSize: Math.round(14 * scale),
          color: "rgba(255,255,255,0.5)",
          textAlign: "center",
        }}
      >
        {error}
      </span>
    </div>
  );
};

// ── Skeleton: shown while loading ──
const LottieSkeleton: React.FC<{ size: number; scale: number }> = ({ size, scale }) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 20 * scale,
        backgroundColor: "rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 48 * scale,
          height: 48 * scale,
          borderRadius: "50%",
          border: `${4 * scale}px solid rgba(255,255,255,0.25)`,
          borderTopColor: colors.teal,
          animation: "spin 1s linear infinite",
        }}
      />
    </div>
  );
};
