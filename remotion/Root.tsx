import "./fonts.css";
import React from "react";
import { Composition } from "remotion";
import { DynamicVideo } from "../lib/remotion/DynamicVideo";
import { FORMAT_PRESETS, getDimensions } from "../lib/remotion/styles";
import { DEFAULT_VIDEO_CONFIG, type VideoConfig } from "../lib/remotion/types";

const FPS = 30;

// The composition dimensions and duration are derived from the config at
// render time via calculateMetadata. Default values are placeholders used
// only when the composition is loaded without inputProps.
export const RemotionRoot: React.FC = () => {
  return (
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
  );
};
