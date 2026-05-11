"use client";

import { useStudioStore } from "@/lib/studio/store";
import { Accordion } from "@/components/ui/accordion";
import { ScenePropertyEditor } from "./scene-property-editor";
import { StudioLogoUploader } from "./studio-logo-uploader";
import { MotionEditor } from "./motion-editor";
import { BrandColorsEditor } from "./brand-colors-editor";

export function PropertyPanel() {
  const config = useStudioStore((s) => s.config);
  const selectedSceneIndex = useStudioStore((s) => s.selectedSceneIndex);
  const selectedScene =
    selectedSceneIndex !== null ? config.scenes[selectedSceneIndex] : null;

  return (
    <div className="p-4 space-y-3">
      <Accordion title="Aktuell scen" defaultOpen>
        {selectedScene && selectedSceneIndex !== null ? (
          <ScenePropertyEditor
            scene={selectedScene}
            index={selectedSceneIndex}
          />
        ) : (
          <p className="text-sm text-nordea-text-tertiary py-4 text-center">
            Välj en scen i tidslinjen
          </p>
        )}
      </Accordion>

      <Accordion title="Logotyp">
        <StudioLogoUploader />
      </Accordion>

      <Accordion title="Motion">
        <MotionEditor />
      </Accordion>

      <Accordion title="Färger">
        <BrandColorsEditor />
      </Accordion>
    </div>
  );
}
