"use client";

// Höger kant i Motion Studio: en smal ikonlist som fälls ut till en panel.
// Återanvänder de befintliga redigerarna — scenen, stil, rörelse, tillgångar
// och AI-varianter — utan att de tar plats från videon när de inte behövs.

import { SlidersHorizontal, Palette, Activity, ImageIcon, Layers, X, type LucideIcon } from "lucide-react";
import { useStudioStore, type InspectorTab } from "@/lib/studio/store";
import { Accordion } from "@/components/ui/accordion";
import { ScenePropertyEditor } from "./scene-property-editor";
import { TextAnimationEditor } from "./text-animation-editor";
import { SelectedElementPanel } from "./selected-element-panel";
import { StudioLogoUploader } from "./studio-logo-uploader";
import { MotionEditor } from "./motion-editor";
import { BrandColorsEditor } from "./brand-colors-editor";
import { AssetPicker, type PickedAsset } from "./asset-picker";
import { VariantsPanel } from "./variants-panel";

const TABS: Array<{ id: InspectorTab; label: string; icon: LucideIcon }> = [
  { id: "scene", label: "Scen", icon: SlidersHorizontal },
  { id: "style", label: "Stil och logga", icon: Palette },
  { id: "motion", label: "Rörelse", icon: Activity },
  { id: "assets", label: "Tillgångar", icon: ImageIcon },
  { id: "variants", label: "AI-varianter", icon: Layers },
];

export function Inspector() {
  const tab = useStudioStore((s) => s.inspectorTab);
  const setTab = useStudioStore((s) => s.setInspectorTab);
  const variantsCount = useStudioStore((s) => s.variants.length);
  const active = TABS.find((t) => t.id === tab);

  return (
    // Under 1280 px lägger sig panelen ovanpå videon i stället för att tränga
    // ihop den; på bredare skärmar tar den egen plats.
    <div className="relative flex flex-shrink-0 h-full">
      {active && (
        <div className="absolute right-14 top-0 z-30 w-[340px] h-full border-l border-nordea-border bg-white flex flex-col shadow-[-16px_0_40px_-20px_rgba(0,0,94,0.35)] xl:relative xl:right-auto xl:shadow-none animate-in slide-in-from-right-4 fade-in duration-200">
          <div className="h-12 px-4 flex items-center justify-between border-b border-nordea-hairline flex-shrink-0">
            <span className="text-sm font-semibold text-nordea-text">{active.label}</span>
            <button
              type="button"
              onClick={() => setTab(null)}
              aria-label="Stäng panelen"
              className="p-1.5 rounded-md text-nordea-text-tertiary hover:text-nordea-text hover:bg-nordea-bg-hover"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <InspectorBody tab={active.id} />
          </div>
        </div>
      )}

      <nav
        aria-label="Egenskaper"
        className="w-14 h-full border-l border-nordea-border bg-white flex flex-col items-center gap-1 py-3"
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(isActive ? null : id)}
              aria-label={label}
              aria-pressed={isActive}
              title={label}
              className={`relative w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                isActive
                  ? "bg-nordea-blue-soft text-nordea-blue"
                  : "text-nordea-text-tertiary hover:text-nordea-text hover:bg-nordea-bg-hover"
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              {id === "variants" && variantsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-nordea-teal" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function InspectorBody({ tab }: { tab: InspectorTab }) {
  const config = useStudioStore((s) => s.config);
  const selectedSceneIndex = useStudioStore((s) => s.selectedSceneIndex);
  const selectedElementId = useStudioStore((s) => s.selectedElementId);
  const updateScene = useStudioStore((s) => s.updateScene);
  const scene = selectedSceneIndex !== null ? config.scenes[selectedSceneIndex] : null;

  const handleAssetSelect = (asset: PickedAsset) => {
    if (selectedSceneIndex === null) {
      window.alert("Välj en scen i tidslinjen först");
      return;
    }
    if (asset.type === "photo") {
      updateScene(selectedSceneIndex, { background: `url("${asset.url}")` });
    } else {
      window.alert("Videobakgrunder stöds inte än — fotobakgrunder fungerar.");
    }
  };

  switch (tab) {
    case "scene":
      return (
        <div className="p-4 space-y-3">
          {selectedElementId && <SelectedElementPanel />}
          {scene && selectedSceneIndex !== null ? (
            <>
              <Accordion title={`Scen ${selectedSceneIndex + 1}`} defaultOpen>
                <ScenePropertyEditor scene={scene} index={selectedSceneIndex} />
              </Accordion>
              <Accordion title="Textanimation">
                <TextAnimationEditor scene={scene} sceneIndex={selectedSceneIndex} />
              </Accordion>
            </>
          ) : (
            <p className="text-sm text-nordea-text-tertiary py-6 text-center">Välj en scen nertill</p>
          )}
        </div>
      );
    case "style":
      return (
        <div className="p-4 space-y-3">
          <Accordion title="Färger" defaultOpen>
            <BrandColorsEditor />
          </Accordion>
          <Accordion title="Logotyp">
            <StudioLogoUploader />
          </Accordion>
        </div>
      );
    case "motion":
      return (
        <div className="p-4">
          <MotionEditor />
        </div>
      );
    case "assets":
      return (
        <div className="p-4">
          <AssetPicker onSelect={handleAssetSelect} />
        </div>
      );
    case "variants":
      return <VariantsPanel embedded />;
  }
}
