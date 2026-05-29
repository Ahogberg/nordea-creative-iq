"use client";

import { useStudioStore } from "@/lib/studio/store";
import { Accordion } from "@/components/ui/accordion";
import { ScenePropertyEditor } from "./scene-property-editor";
import { StudioLogoUploader } from "./studio-logo-uploader";
import { MotionEditor } from "./motion-editor";
import { BrandColorsEditor } from "./brand-colors-editor";
import { AssetPicker, type PickedAsset } from "./asset-picker";
import { TextAnimationEditor } from "./text-animation-editor";

export function PropertyPanel() {
  const config = useStudioStore((s) => s.config);
  const selectedSceneIndex = useStudioStore((s) => s.selectedSceneIndex);
  const updateScene = useStudioStore((s) => s.updateScene);
  const selectedScene =
    selectedSceneIndex !== null ? config.scenes[selectedSceneIndex] : null;

  const handleAssetSelect = (asset: PickedAsset) => {
    // Photos can be wired straight into the scene `background` slot; videos
    // need a richer scene type, so for now we surface the picked URL so the
    // user knows what they selected and skip the partial wire-up.
    if (selectedSceneIndex === null) {
      window.alert("Välj en scen i tidslinjen först");
      return;
    }
    if (asset.type === "photo") {
      updateScene(selectedSceneIndex, {
        background: `url("${asset.url}")`,
      });
    } else {
      window.alert(
        "Video-bakgrunder kräver Lottie/video-scene-utökning — kommer i nästa iteration. Foto-bakgrunder fungerar redan."
      );
    }
  };

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

      <Accordion title="Text-animation">
        {selectedScene && selectedSceneIndex !== null ? (
          <TextAnimationEditor
            scene={selectedScene}
            sceneIndex={selectedSceneIndex}
          />
        ) : (
          <p className="text-sm text-nordea-text-tertiary py-4 text-center">
            Välj en scen
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

      <Accordion title="Tillgångar">
        <AssetPicker onSelect={handleAssetSelect} />
      </Accordion>
    </div>
  );
}
