// ── Motion Studio state store (Sprint 8a + 8b) ──
//
// Single source of truth for the property-driven Studio UI. Wraps the
// existing VideoConfig from lib/remotion/types so the existing Remotion
// rendering pipeline keeps working untouched.
//
// Aspect-ratio toggle writes to `config.format` (no separate field —
// VideoConfig already carries this).
//
// Sprint 8b adds variants state (AI-generated alternative configs).

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type {
  VideoConfig,
  Scene,
  MotionConfig,
  LogoConfig,
  ElementTransform,
  SceneAsset,
} from "@/lib/remotion/types";
import {
  DEFAULT_VIDEO_CONFIG,
  DEFAULT_MOTION_CONFIG,
  DEFAULT_ELEMENT_TRANSFORM,
} from "@/lib/remotion/types";

export type AspectRatio = VideoConfig["format"]; // 'story' | 'feed' | 'landscape' | 'vertical'

export interface AspectRatioInfo {
  label: string;
  ratio: string;
  width: number;
  height: number;
}

export const ASPECT_RATIOS: Record<AspectRatio, AspectRatioInfo> = {
  story: { label: "Story", ratio: "9:16", width: 1080, height: 1920 },
  feed: { label: "Feed", ratio: "1:1", width: 1080, height: 1080 },
  landscape: { label: "Landskap", ratio: "16:9", width: 1920, height: 1080 },
  vertical: { label: "Vertikal", ratio: "4:5", width: 1080, height: 1350 },
};

// ── Variants (Sprint 8b) ──
export interface VariantChange {
  type: "text" | "motion" | "duration" | "color" | "scene_order";
  description: string;
}

export interface Variant {
  id: string;
  thumbnail_url?: string;
  config_diff: {
    description: string;
    changes: VariantChange[];
  };
  full_config: VideoConfig;
}

interface StudioState {
  config: VideoConfig;
  selectedSceneIndex: number | null;
  previewKey: number;
  isRendering: boolean;

  // Variants (8b)
  variants: Variant[];
  isGeneratingVariants: boolean;

  // Sprint 11A: canvas selection state
  // elementId conventions:
  //   "headline", "subtitle", "cta", "line", "value", "label"  → text elements
  //   "asset-<assetId>"                                         → asset overlays
  selectedElementId: string | null;
  hoveredElementId: string | null;
  isDragging: boolean;

  setAspectRatio: (ratio: AspectRatio) => void;
  setSelectedScene: (index: number | null) => void;
  updateScene: (index: number, updates: Partial<Scene>) => void;
  addScene: (scene: Scene) => void;
  removeScene: (index: number) => void;
  reorderScenes: (fromIndex: number, toIndex: number) => void;
  updateMotion: (motion: MotionConfig) => void;
  setLogo: (logo: LogoConfig | undefined) => void;
  triggerRender: () => void;
  setIsRendering: (rendering: boolean) => void;
  loadConfig: (config: VideoConfig) => void;

  // Variants actions (8b)
  generateVariants: () => Promise<void>;
  applyVariant: (variantId: string) => void;
  clearVariants: () => void;

  // Sprint 11A: canvas actions
  selectElement: (id: string | null) => void;
  hoverElement: (id: string | null) => void;
  setDragging: (isDragging: boolean) => void;
  updateElementTransform: (
    sceneIndex: number,
    elementId: string,
    patch: Partial<ElementTransform>
  ) => void;
  addAssetToScene: (sceneIndex: number, asset: SceneAsset) => void;
  removeAssetFromScene: (sceneIndex: number, assetId: string) => void;
  updateAssetTransform: (
    sceneIndex: number,
    assetId: string,
    patch: Partial<ElementTransform>
  ) => void;
}

export const useStudioStore = create<StudioState>()(
  subscribeWithSelector((set, get) => ({
    config: DEFAULT_VIDEO_CONFIG,
    selectedSceneIndex: 0,
    previewKey: 0,
    isRendering: false,

    variants: [],
    isGeneratingVariants: false,

    selectedElementId: null,
    hoveredElementId: null,
    isDragging: false,

    setAspectRatio: (ratio) =>
      set((state) => ({ config: { ...state.config, format: ratio } })),

    setSelectedScene: (index) => set({ selectedSceneIndex: index }),

    updateScene: (index, updates) =>
      set((state) => {
        const scenes = [...state.config.scenes];
        scenes[index] = { ...scenes[index], ...updates } as Scene;
        return { config: { ...state.config, scenes } };
      }),

    addScene: (scene) =>
      set((state) => ({
        config: { ...state.config, scenes: [...state.config.scenes, scene] },
        selectedSceneIndex: state.config.scenes.length,
      })),

    removeScene: (index) =>
      set((state) => {
        const scenes = state.config.scenes.filter((_, i) => i !== index);
        return {
          config: { ...state.config, scenes },
          selectedSceneIndex:
            scenes.length > 0 ? Math.min(index, scenes.length - 1) : null,
        };
      }),

    reorderScenes: (fromIndex, toIndex) =>
      set((state) => {
        const scenes = [...state.config.scenes];
        const [moved] = scenes.splice(fromIndex, 1);
        scenes.splice(toIndex, 0, moved);
        return { config: { ...state.config, scenes } };
      }),

    updateMotion: (motion) =>
      set((state) => ({ config: { ...state.config, motion } })),

    setLogo: (logo) =>
      set((state) => ({
        config: {
          ...state.config,
          logo,
          showLogo: logo?.url ? true : state.config.showLogo,
        },
      })),

    triggerRender: () =>
      set((state) => ({ previewKey: state.previewKey + 1 })),

    setIsRendering: (rendering) => set({ isRendering: rendering }),

    loadConfig: (config) =>
      set({
        config: { ...config, motion: config.motion ?? DEFAULT_MOTION_CONFIG },
        selectedSceneIndex: config.scenes.length > 0 ? 0 : null,
        previewKey: 0,
      }),

    // ── Variants ────────────────────────────────────────────────────────
    generateVariants: async () => {
      const state = get();
      set({ isGeneratingVariants: true, variants: [] });

      try {
        const res = await fetch("/api/studio/generate-variants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ config: state.config, count: 3 }),
        });

        if (!res.ok) throw new Error("Variant generation failed");
        const data = await res.json();
        set({ variants: data.variants ?? [], isGeneratingVariants: false });
      } catch (error) {
        console.error("[studio] generateVariants failed:", error);
        set({ isGeneratingVariants: false });
      }
    },

    applyVariant: (variantId) =>
      set((state) => {
        const variant = state.variants.find((v) => v.id === variantId);
        if (!variant) return state;
        return {
          config: {
            ...variant.full_config,
            motion: variant.full_config.motion ?? DEFAULT_MOTION_CONFIG,
          },
          selectedSceneIndex:
            variant.full_config.scenes.length > 0 ? 0 : null,
          variants: [],
        };
      }),

    clearVariants: () => set({ variants: [] }),

    // ── Sprint 11A: canvas actions ──────────────────────────────────────
    selectElement: (id) => set({ selectedElementId: id }),
    hoverElement: (id) => set({ hoveredElementId: id }),
    setDragging: (isDragging) => set({ isDragging }),

    updateElementTransform: (sceneIndex, elementId, patch) =>
      set((state) => {
        const scenes = [...state.config.scenes];
        const scene = scenes[sceneIndex];
        if (!scene) return state;
        const existing = scene.elementTransforms?.[elementId];
        const next: ElementTransform = {
          ...DEFAULT_ELEMENT_TRANSFORM,
          ...(existing ?? {}),
          ...patch,
        };
        scenes[sceneIndex] = {
          ...scene,
          elementTransforms: {
            ...(scene.elementTransforms ?? {}),
            [elementId]: next,
          },
        } as Scene;
        return { config: { ...state.config, scenes } };
      }),

    addAssetToScene: (sceneIndex, asset) =>
      set((state) => {
        const scenes = [...state.config.scenes];
        const scene = scenes[sceneIndex];
        if (!scene) return state;
        scenes[sceneIndex] = {
          ...scene,
          assets: [...(scene.assets ?? []), asset],
        } as Scene;
        return { config: { ...state.config, scenes } };
      }),

    removeAssetFromScene: (sceneIndex, assetId) =>
      set((state) => {
        const scenes = [...state.config.scenes];
        const scene = scenes[sceneIndex];
        if (!scene) return state;
        scenes[sceneIndex] = {
          ...scene,
          assets: (scene.assets ?? []).filter((a) => a.id !== assetId),
        } as Scene;
        return { config: { ...state.config, scenes } };
      }),

    updateAssetTransform: (sceneIndex, assetId, patch) =>
      set((state) => {
        const scenes = [...state.config.scenes];
        const scene = scenes[sceneIndex];
        if (!scene?.assets) return state;
        scenes[sceneIndex] = {
          ...scene,
          assets: scene.assets.map((a) =>
            a.id === assetId
              ? { ...a, layout: { ...a.layout, ...patch } }
              : a
          ),
        } as Scene;
        return { config: { ...state.config, scenes } };
      }),
  }))
);

// ── Debounced preview re-render ──
// 1.5s after the last config mutation, bump previewKey so the Remotion
// Player re-mounts with the new props. Avoids per-keystroke render thrash.
let renderTimeout: NodeJS.Timeout | null = null;

useStudioStore.subscribe(
  (state) => state.config,
  () => {
    if (renderTimeout) clearTimeout(renderTimeout);
    renderTimeout = setTimeout(() => {
      useStudioStore.getState().triggerRender();
    }, 1500);
  },
  { equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b) }
);
