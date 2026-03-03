import React from 'react';
import { Composition } from 'remotion';
import { NordeaVideo } from './NordeaVideo';
import { DEFAULT_VIDEO_CONFIG, VIDEO_FORMATS } from '@/lib/video-types';

export const RemotionRoot: React.FC = () => (
  <>
    {VIDEO_FORMATS.map((format) => (
      <Composition
        key={format.id}
        id={`Nordea-${format.id}`}
        component={NordeaVideo}
        durationInFrames={150}
        fps={30}
        width={format.width}
        height={format.height}
        defaultProps={{ config: { ...DEFAULT_VIDEO_CONFIG, width: format.width, height: format.height } }}
      />
    ))}
  </>
);
