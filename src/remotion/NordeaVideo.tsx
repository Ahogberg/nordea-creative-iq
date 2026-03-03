import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Img,
  staticFile,
  OffthreadVideo,
} from 'remotion';
import type { VideoConfig, TextPlate } from '@/lib/video-types';

const FADE_DURATION = 12;

export const NordeaVideo: React.FC<{ config: VideoConfig }> = ({ config }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { background, textPlates, logo } = config;

  const finalFade = interpolate(
    frame,
    [durationInFrames - FADE_DURATION, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const renderBackground = () => {
    switch (background.type) {
      case 'solid':
        return <AbsoluteFill style={{ backgroundColor: background.solidColor }} />;
      case 'gradient':
        return (
          <AbsoluteFill
            style={{
              background: `linear-gradient(${background.gradientAngle}deg, ${background.gradientStart}, ${background.gradientEnd})`,
            }}
          />
        );
      case 'image':
        return background.imageUrl ? (
          <AbsoluteFill>
            <Img src={background.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: background.opacity }} />
          </AbsoluteFill>
        ) : null;
      case 'video':
        return background.videoUrl ? (
          <AbsoluteFill>
            <OffthreadVideo src={background.videoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: background.opacity }} />
          </AbsoluteFill>
        ) : null;
      default:
        return <AbsoluteFill style={{ backgroundColor: '#00005E' }} />;
    }
  };

  const getLogoPosition = (): React.CSSProperties => {
    const p = 60;
    const base: React.CSSProperties = { position: 'absolute' };
    switch (logo.position) {
      case 'top-left': return { ...base, top: p, left: p };
      case 'top-center': return { ...base, top: p, left: '50%', transform: 'translateX(-50%)' };
      case 'top-right': return { ...base, top: p, right: p };
      case 'bottom-left': return { ...base, bottom: p + 100, left: p };
      case 'bottom-center': return { ...base, bottom: p + 100, left: '50%', transform: 'translateX(-50%)' };
      case 'bottom-right': return { ...base, bottom: p + 100, right: p };
      default: return { ...base, top: p, left: '50%', transform: 'translateX(-50%)' };
    }
  };

  const logoOpacity = interpolate(frame, [0, FADE_DURATION], [0, logo.opacity], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ opacity: finalFade }}>
      {renderBackground()}
      {logo.visible && (
        <div style={{ ...getLogoPosition(), opacity: logoOpacity }}>
          <Img src={staticFile('brand/nordea-logo-white.svg')} style={{ width: logo.size, height: 'auto' }} />
        </div>
      )}
      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '180px 50px', gap: 24 }}>
        {textPlates.map((plate) => <TextPlateRenderer key={plate.id} plate={plate} />)}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const TextPlateRenderer: React.FC<{ plate: TextPlate }> = ({ plate }) => {
  const frame = useCurrentFrame();
  const { startFrame, endFrame, animation } = plate;

  const fadeIn = interpolate(frame, [startFrame, startFrame + FADE_DURATION], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [endFrame - FADE_DURATION, endFrame], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const opacity = Math.min(fadeIn, fadeOut);

  let transform = 'translateY(0)';
  if (animation === 'slide-up') {
    const y = interpolate(frame, [startFrame, startFrame + FADE_DURATION], [30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    transform = `translateY(${y}px)`;
  } else if (animation === 'slide-down') {
    const y = interpolate(frame, [startFrame, startFrame + FADE_DURATION], [-30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    transform = `translateY(${y}px)`;
  } else if (animation === 'scale') {
    const s = interpolate(frame, [startFrame, startFrame + FADE_DURATION], [0.8, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    transform = `scale(${s})`;
  }

  if (frame < startFrame - 5 || frame > endFrame + 5) return null;

  const textStyle: React.CSSProperties = {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: plate.fontSize,
    fontWeight: plate.fontWeight,
    color: plate.color,
    textAlign: 'center',
    lineHeight: 1.3,
    margin: 0,
    opacity,
    transform,
  };

  if (plate.isCta) {
    return (
      <div style={{ opacity, transform }}>
        <div style={{ backgroundColor: plate.ctaBackgroundColor, paddingLeft: 40, paddingRight: 40, paddingTop: 18, paddingBottom: 18, borderRadius: plate.ctaBorderRadius }}>
          <span style={{ ...textStyle, opacity: 1, transform: 'none' }}>{plate.text}</span>
        </div>
      </div>
    );
  }
  return <p style={textStyle}>{plate.text}</p>;
};
