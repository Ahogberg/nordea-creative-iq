import "./fonts.css";
import React from "react";
import { Composition } from "remotion";
import { DynamicVideo } from "../lib/remotion/DynamicVideo";
import { FORMAT_PRESETS, getDimensions } from "../lib/remotion/styles";
import { DEFAULT_VIDEO_CONFIG, type VideoConfig } from "../lib/remotion/types";
import { DisplayBanner, type DisplayBannerProps } from "../lib/display/DisplayBanner";

const FPS = 30;

const DEFAULT_BANNER: DisplayBannerProps = {
  width: 300,
  height: 250,
  content: { headline: "Nordea", cta: "Läs mer", background: "#0000A0" },
};

// The composition dimensions and duration are derived from the config at
// render time via calculateMetadata. Default values are placeholders used
// only when the composition is loaded without inputProps.
export const RemotionRoot: React.FC = () => {
  return (
    <>
    {/* Displaybanner: statisk bild, en ruta per format. Längden räcker till
        illustrationens tidpunkt så att renderStill kan visa den. */}
    <Composition
      id="NordeaDisplay"
      component={DisplayBanner}
      durationInFrames={1}
      fps={FPS}
      width={DEFAULT_BANNER.width}
      height={DEFAULT_BANNER.height}
      defaultProps={DEFAULT_BANNER}
      calculateMetadata={({ props }) => {
        const at = props.content.illustration?.atSeconds ?? 0;
        return {
          durationInFrames: Math.max(1, Math.ceil(at * FPS) + 1),
          fps: FPS,
          width: props.width,
          height: props.height,
        };
      }}
    />
    <Composition
      id="NordeaMotion"
      component={DynamicVideo}
      durationInFrames={Math.max(1, Math.round(DEFAULT_VIDEO_CONFIG.totalDurationSeconds * FPS))}
      fps={FPS}
      width={FORMAT_PRESETS.story.width}
      height={FORMAT_PRESETS.story.height}
      defaultProps={{ config: DEFAULT_VIDEO_CONFIG }}
      calculateMetadata={({ props }) => {
        const config = props.config as VideoConfig;
        const { width, height } = getDimensions(config.format, config.quality);
        const totalSeconds = config.scenes.reduce(
          (sum, s) => sum + (s.durationSeconds || 2),
          0
        );
        return {
          durationInFrames: Math.max(1, Math.round(totalSeconds * FPS)),
          fps: FPS,
          width,
          height,
        };
      }}
    />
    </>
  );
};
