"use client";

import React, { useMemo } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { DynamicVideo } from "./DynamicVideo";
import { FORMAT_PRESETS } from "./styles";
import type { VideoConfig } from "./types";

const FPS = 30;

interface PlayerWrapperProps {
  config: VideoConfig;
  playing?: boolean;
  loop?: boolean;
  controls?: boolean;
  className?: string;
  style?: React.CSSProperties;
  /** Ger tillgång till spelaren (play/paus, sökning, bildrutehändelser). */
  playerRef?: React.Ref<PlayerRef>;
}

export const MotionPlayer: React.FC<PlayerWrapperProps> = ({
  config,
  playing = true,
  loop = true,
  controls = false,
  className,
  style,
  playerRef,
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
      ref={playerRef}
      component={DynamicVideo}
      inputProps={{ config }}
      durationInFrames={Math.max(totalDuration, 1)}
      compositionWidth={format.width}
      compositionHeight={format.height}
      fps={FPS}
      autoPlay={playing}
      loop={loop}
      controls={controls}
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
