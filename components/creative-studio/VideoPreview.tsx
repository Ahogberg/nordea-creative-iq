'use client';

import React from 'react';
import { Player } from '@remotion/player';
import { NordeaVideo } from '@/src/remotion/NordeaVideo';
import type { VideoConfig } from '@/lib/video-types';

interface VideoPreviewProps {
  config: VideoConfig;
}

export function VideoPreview({ config }: VideoPreviewProps) {
  const aspectRatio = config.width / config.height;
  const maxHeight = 600;
  const maxWidth = 800;

  let displayHeight = maxHeight;
  let displayWidth = displayHeight * aspectRatio;

  if (displayWidth > maxWidth) {
    displayWidth = maxWidth;
    displayHeight = displayWidth / aspectRatio;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="rounded-xl overflow-hidden shadow-lg bg-black"
        style={{ width: displayWidth, height: displayHeight }}
      >
        <Player
          component={NordeaVideo}
          inputProps={{ config }}
          durationInFrames={config.durationInFrames}
          fps={config.fps}
          compositionWidth={config.width}
          compositionHeight={config.height}
          style={{ width: '100%', height: '100%' }}
          controls
          autoPlay={false}
          loop
        />
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span>{config.width} × {config.height}</span>
        <span>{config.fps} fps</span>
        <span>{(config.durationInFrames / config.fps).toFixed(1)}s</span>
      </div>
    </div>
  );
}
