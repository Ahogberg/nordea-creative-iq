'use client';

import React, { useState, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { VideoPreview } from '@/components/creative-studio/VideoPreview';
import { FormatSelector } from '@/components/creative-studio/FormatSelector';
import { BackgroundControls } from '@/components/creative-studio/BackgroundControls';
import { TextPlateEditor } from '@/components/creative-studio/TextPlateEditor';
import { LogoControls } from '@/components/creative-studio/LogoControls';
import { TimelineControls } from '@/components/creative-studio/TimelineControls';
import {
  DEFAULT_VIDEO_CONFIG,
  VIDEO_FORMATS,
  type VideoConfig,
  type VideoFormat,
  type BackgroundConfig,
  type TextPlate,
  type LogoConfig,
} from '@/lib/video-types';
import { Film } from 'lucide-react';

export default function CreativeStudioPage() {
  const [config, setConfig] = useState<VideoConfig>(DEFAULT_VIDEO_CONFIG);
  const [selectedFormat, setSelectedFormat] = useState<VideoFormat>(VIDEO_FORMATS[0]);

  const updateConfig = useCallback((patch: Partial<VideoConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleFormatChange = useCallback((format: VideoFormat) => {
    setSelectedFormat(format);
    setConfig((prev) => ({
      ...prev,
      width: format.width,
      height: format.height,
    }));
  }, []);

  const handleBackgroundChange = useCallback((background: BackgroundConfig) => {
    updateConfig({ background });
  }, [updateConfig]);

  const handleTextPlatesChange = useCallback((textPlates: TextPlate[]) => {
    updateConfig({ textPlates });
  }, [updateConfig]);

  const handleLogoChange = useCallback((logo: LogoConfig) => {
    updateConfig({ logo });
  }, [updateConfig]);

  const handleDurationChange = useCallback((durationInFrames: number) => {
    updateConfig({ durationInFrames });
  }, [updateConfig]);

  const handleFpsChange = useCallback((fps: number) => {
    updateConfig({ fps });
  }, [updateConfig]);

  return (
    <div className="h-[calc(100vh-64px)] flex">
      {/* Left sidebar - controls */}
      <div className="w-80 border-r border-gray-200 bg-white flex-shrink-0">
        <div className="h-14 flex items-center px-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-[#0000A0]" />
            <h1 className="text-sm font-semibold text-gray-900">Creative Studio</h1>
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-64px-56px)]">
          <div className="p-4 space-y-5">
            <FormatSelector selectedFormat={selectedFormat} onSelect={handleFormatChange} />
            <Separator />
            <TimelineControls
              durationInFrames={config.durationInFrames}
              fps={config.fps}
              onDurationChange={handleDurationChange}
              onFpsChange={handleFpsChange}
            />
            <Separator />
            <BackgroundControls background={config.background} onChange={handleBackgroundChange} />
            <Separator />
            <LogoControls logo={config.logo} onChange={handleLogoChange} />
            <Separator />
            <TextPlateEditor
              plates={config.textPlates}
              onChange={handleTextPlatesChange}
              durationInFrames={config.durationInFrames}
              fps={config.fps}
            />
          </div>
        </ScrollArea>
      </div>

      {/* Main area - preview */}
      <div className="flex-1 bg-gray-50 flex items-center justify-center p-8">
        <VideoPreview config={config} />
      </div>
    </div>
  );
}
