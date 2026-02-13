'use client';

export interface ExtractedFrame {
  timestamp: number;
  dataUrl: string;
}

/**
 * Extracts frames from a video file using Canvas API.
 * Works entirely in the browser — no FFmpeg needed.
 */
export async function extractFramesFromVideo(
  videoFile: File,
  options: {
    frameInterval?: number; // seconds between frames
    maxFrames?: number;
  } = {}
): Promise<ExtractedFrame[]> {
  const { frameInterval = 2, maxFrames = 10 } = options;

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const frames: ExtractedFrame[] = [];

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const duration = video.duration;
      const timestamps: number[] = [];
      let t = 0;

      // Calculate timestamps to extract
      while (t < duration && timestamps.length < maxFrames) {
        timestamps.push(t);
        t += frameInterval;
      }

      // Always include a frame near the end
      if (timestamps.length > 0 && timestamps[timestamps.length - 1] < duration - 1) {
        timestamps.push(Math.max(0, duration - 0.5));
      }

      let frameIndex = 0;

      const captureFrame = () => {
        if (frameIndex >= timestamps.length) {
          URL.revokeObjectURL(video.src);
          resolve(frames);
          return;
        }
        video.currentTime = timestamps[frameIndex];
      };

      video.onseeked = () => {
        ctx.drawImage(video, 0, 0);
        frames.push({
          timestamp: timestamps[frameIndex],
          dataUrl: canvas.toDataURL('image/jpeg', 0.8),
        });
        frameIndex++;
        captureFrame();
      };

      captureFrame();
    };

    video.onerror = () => {
      reject(new Error('Error loading video'));
    };

    video.src = URL.createObjectURL(videoFile);
  });
}

/**
 * Get basic video metadata (duration, dimensions).
 */
export async function getVideoMetadata(
  videoFile: File
): Promise<{ duration: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });
      URL.revokeObjectURL(video.src);
    };

    video.onerror = () => {
      reject(new Error('Error loading video metadata'));
    };

    video.src = URL.createObjectURL(videoFile);
  });
}
