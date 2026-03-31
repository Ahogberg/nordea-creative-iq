"use client";

import React, { useMemo } from "react";
import { Player } from "@remotion/player";
import { DynamicVideo } from "./DynamicVideo";
import { FORMAT_PRESETS } from "./styles";
import type { VideoConfig } from "./types";

const FPS = 30;

interface PlayerWrapperProps {
  config: VideoConfig;
  playing?: boolean;
  loop?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const MotionPlayer: React.FC<PlayerWrapperProps> = ({
  config,
  playing = true,
  loop = true,
  className,
  style,
}) => {
  const format = FORMAT_PRESETS[config.format] || FORMAT_PRESETS.story;
  const totalDuration = useMemo(
    () =>
      Math.round(
        config.scenes.reduce((sum, s) => sum + s.durationSeconds, 0) * FPS
      ),
    [config.scenes]
  );

  return (
    <Player
      component={DynamicVideo}
      inputProps={{ config }}
      durationInFrames={Math.max(totalDuration, 1)}
      compositionWidth={format.width}
      compositionHeight={format.height}
      fps={FPS}
      autoPlay={playing}
      loop={loop}
      controls
      className={className}
      style={{
        width: "100%",
        maxHeight: "100%",
        borderRadius: 12,
        ...style,
      }}
    />
  );
};
