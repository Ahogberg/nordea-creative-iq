"use client";

import { PropertyPanel } from "@/components/studio/property-panel";
import { LivePreview } from "@/components/studio/live-preview";
import { Timeline } from "@/components/studio/timeline";
import { AspectRatioTabs } from "@/components/studio/aspect-ratio-tabs";

// Reuses the Sprint 8a Studio building blocks. The Master is just a regular
// VideoConfig — what makes it "master" is the projection to other formats
// in the variants view, not the editor itself.
export function MasterCanvas() {
  return (
    <div className="h-full flex flex-col">
      <AspectRatioTabs />

      <div className="flex-1 flex min-h-0">
        <div className="w-[330px] border-r border-nordea-border bg-white overflow-y-auto">
          <PropertyPanel />
        </div>

        <div className="flex-1 flex flex-col bg-nordea-bg min-w-0">
          <LivePreview />
        </div>
      </div>

      <div className="h-[120px] border-t border-nordea-border bg-white flex-shrink-0">
        <Timeline />
      </div>
    </div>
  );
}
