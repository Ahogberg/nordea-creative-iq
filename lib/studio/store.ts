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
import { describeChanges } from "./describe-changes";

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

// ── Chatt ──
// Varje AI-svar sparar configen före ändringen så att det senaste svaret
// kan ångras.
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: "pending" | "done" | "error";
  /** Korta etiketter för vad som ändrades (describeChanges). */
  changes?: string[];
  /** Configen innan svaret tillämpades — för Ångra. */
  before?: VideoConfig;
  undone?: boolean;
  /** Användarens text som svaret gäller — för Försök igen. */
  retryText?: string;
  startedAt?: number;
  /** Självgranskningen av resultatet (körs automatiskt efter varje ändring). */
  review?: ChatReview;
}

export interface ChatReviewIssue {
  severity: "error" | "warning" | "info";
  message: string;
  fixed: boolean;
  source: "regel" | "visuell";
}

export interface ChatReview {
  status: "pending" | "done" | "error";
  issues?: ChatReviewIssue[];
  /** Stillbilderna som granskades. */
  frames?: Array<{ sceneIndex: number; seconds: number; src: string }>;
  /** Rättningar tillämpades på videon. */
  applied?: boolean;
  /** Visuell granskning gjordes (annars bara regelkontroll). */
  visual?: boolean;
  /** Varför den visuella granskningen inte kördes, om den försöktes. */
  visualError?: string | null;
  error?: string;
}

export type InspectorTab = "scene" | "style" | "motion" | "assets" | "variants";

interface StudioState {
  config: VideoConfig;

  // Chatt (Motion Studio-layouten)
  messages: ChatMessage[];
  isChatBusy: boolean;
  /** Första utkastet genereras (från ?prompt) — scenen visar ett vänteläge. */
  isDrafting: boolean;
  inspectorTab: InspectorTab | null;
  setInspectorTab: (tab: InspectorTab | null) => void;
  startFromPrompt: (prompt: string) => Promise<void>;
  sendChatMessage: (text: string) => Promise<void>;
  undoMessage: (id: string) => void;
  retryMessage: (id: string) => Promise<void>;
  clearChat: () => void;

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

    messages: [],
    isChatBusy: false,
    isDrafting: false,
    inspectorTab: null,

    setInspectorTab: (tab) => set({ inspectorTab: tab }),

    startFromPrompt: async (prompt) => {
      if (get().isChatBusy) return;
      set({ isDrafting: true });
      await runChatTurn(prompt, "/api/studio/initial-prompt");
      set({ isDrafting: false });
    },

    sendChatMessage: async (text) => {
      if (get().isChatBusy || !text.trim()) return;
      await runChatTurn(text.trim(), "/api/motion-generate");
    },

    retryMessage: async (id) => {
      const msg = get().messages.find((m) => m.id === id);
      if (!msg?.retryText || get().isChatBusy) return;
      // Ta bort det misslyckade svaret och frågan, skicka om.
      set((s) => ({
        messages: s.messages.filter(
          (m, i, all) => m.id !== id && !(m.role === "user" && all[i + 1]?.id === id)
        ),
      }));
      await runChatTurn(msg.retryText, "/api/motion-generate");
    },

    undoMessage: (id) =>
      set((state) => {
        const msg = state.messages.find((m) => m.id === id);
        if (!msg?.before || msg.undone) return state;
        return {
          config: msg.before,
          selectedSceneIndex: clampScene(state.selectedSceneIndex, msg.before),
          selectedElementId: null,
          messages: state.messages.map((m) => (m.id === id ? { ...m, undone: true } : m)),
        };
      }),

    clearChat: () => set({ messages: [] }),
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

    setSelectedScene: (index) =>
      set({ selectedSceneIndex: index, selectedElementId: null }),

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
          selectedElementId: null,
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
        selectedElementId: null,
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
          selectedElementId: null,
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

// ── Chatt: en tur mot AI:n ──

function clampScene(index: number | null, config: VideoConfig): number | null {
  if (config.scenes.length === 0) return null;
  if (index === null) return 0;
  return Math.min(index, config.scenes.length - 1);
}

let messageSeq = 0;
const newId = () => `msg-${Date.now()}-${++messageSeq}`;

/**
 * Skickar en fråga till AI:n och tillämpar svaret.
 *  - /api/studio/initial-prompt: första utkastet från en brief ({ config })
 *  - /api/motion-generate: ändringar i en befintlig video ({ config, message })
 * Tidigare lyckade fråga/svar-par skickas som historik.
 */
async function runChatTurn(text: string, endpoint: string) {
  const { getState, setState } = useStudioStore;
  const before = getState().config;
  const selected = getState().selectedSceneIndex;

  const userMsg: ChatMessage = { id: newId(), role: "user", content: text, status: "done" };
  const reply: ChatMessage = {
    id: newId(),
    role: "assistant",
    content: "",
    status: "pending",
    retryText: text,
    startedAt: Date.now(),
  };
  setState((s) => ({ messages: [...s.messages, userMsg, reply], isChatBusy: true }));

  const patchReply = (patch: Partial<ChatMessage>) =>
    setState((s) => ({
      messages: s.messages.map((m) => (m.id === reply.id ? { ...m, ...patch } : m)),
    }));

  try {
    const isInitial = endpoint.endsWith("initial-prompt");
    const history = completedTurns(getState().messages);
    // Vald scen följer med så att "gör den här scenen …" fungerar.
    const prompt =
      !isInitial && selected !== null && before.scenes.length > 1
        ? `${text}\n\n(Användaren har scen ${selected + 1} markerad i editorn.)`
        : text;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        isInitial ? { prompt } : { prompt, currentConfig: before, history }
      ),
    });
    const data = (await res.json().catch(() => null)) as {
      config?: VideoConfig | null;
      message?: string;
      error?: string;
    } | null;
    if (!res.ok || !data) throw new Error(data?.error || data?.message || "AI:n svarade med ett fel");

    if (data.config) {
      const next = { ...data.config, motion: data.config.motion ?? DEFAULT_MOTION_CONFIG };
      const changes = describeChanges(before, next);
      setState((s) => ({
        config: next,
        selectedSceneIndex: clampScene(s.selectedSceneIndex, next),
        selectedElementId: null,
      }));
      patchReply({
        status: "done",
        content:
          (isInitial ? undefined : data.message) ??
          `Här är ett första utkast med ${next.scenes.length} scener. Beskriv vad du vill ändra.`,
        changes: isInitial ? undefined : changes,
        before,
        review: { status: "pending" },
      });
      // Videon syns direkt; granskningen körs efteråt och rättar tydliga fel.
      await reviewTurn(reply.id, next, text);
    } else {
      // Bara ett svar, ingen ändring (t.ex. en fråga).
      patchReply({ status: "done", content: data.message ?? "Klart." });
    }
  } catch (err) {
    patchReply({
      status: "error",
      content: err instanceof Error ? err.message : "Något gick fel",
    });
  } finally {
    setState({ isChatBusy: false });
  }
}

/**
 * Självgranskning: regelkontroll + AI som tittar på renderade stillbilder.
 * Rättningar tillämpas bara om videon inte ändrats under tiden.
 */
async function reviewTurn(messageId: string, reviewed: VideoConfig, request: string) {
  const { getState, setState } = useStudioStore;
  const patchReview = (review: ChatReview, extra: Partial<ChatMessage> = {}) =>
    setState((s) => ({
      messages: s.messages.map((m) => (m.id === messageId ? { ...m, ...extra, review } : m)),
    }));

  try {
    const res = await fetch("/api/studio/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config: reviewed, request }),
    });
    const data = (await res.json().catch(() => null)) as {
      issues?: ChatReviewIssue[];
      fixedConfig?: VideoConfig | null;
      frames?: ChatReview["frames"];
      visual?: boolean;
      visualError?: string | null;
      error?: string;
    } | null;
    if (!res.ok || !data) throw new Error(data?.error || "Granskningen misslyckades");

    const fixed = data.fixedConfig;
    const stillSame = getState().config === reviewed;
    let applied = false;
    let extra: Partial<ChatMessage> = {};
    if (fixed && stillSame) {
      const next = { ...fixed, motion: fixed.motion ?? DEFAULT_MOTION_CONFIG };
      setState((s) => ({ config: next, selectedSceneIndex: clampScene(s.selectedSceneIndex, next) }));
      applied = true;
      const msg = getState().messages.find((m) => m.id === messageId);
      if (msg?.changes) extra = { changes: [...new Set([...msg.changes, ...describeChanges(reviewed, next)])].slice(0, 8) };
    }
    patchReview(
      {
        status: "done",
        issues: data.issues ?? [],
        frames: data.frames ?? [],
        applied,
        visual: !!data.visual,
        visualError: data.visualError ?? null,
      },
      extra
    );
  } catch (err) {
    patchReview({ status: "error", error: err instanceof Error ? err.message : "Granskningen misslyckades" });
  }
}

/** Lyckade fråga/svar-par som historik till AI:n (senaste tio meddelandena). */
function completedTurns(messages: ChatMessage[]) {
  const turns: Array<{ role: "user" | "assistant"; content: string }> = [];
  for (let i = 0; i < messages.length - 1; i++) {
    const q = messages[i];
    const a = messages[i + 1];
    if (q.role === "user" && a.role === "assistant" && a.status === "done" && !a.undone) {
      turns.push({ role: "user", content: q.content }, { role: "assistant", content: a.content });
      i++;
    }
  }
  return turns.slice(-10);
}

// ── Debounced preview re-render ──
// 1.5s after the last config mutation, bump previewKey so the Remotion
// Player re-mounts with the new props. Avoids per-keystroke render thrash.
// Sprint 11A: skip the bump while a canvas drag is in progress — the
// Player would re-mount on every drag step. Re-arms itself every 400 ms
// until the drag finishes rather than giving up after one retry.
let renderTimeout: NodeJS.Timeout | null = null;

function scheduleRender(delayMs = 1500) {
  if (renderTimeout) clearTimeout(renderTimeout);
  renderTimeout = setTimeout(() => {
    if (useStudioStore.getState().isDragging) {
      // Re-arm until drag is done — never give up.
      scheduleRender(400);
      return;
    }
    useStudioStore.getState().triggerRender();
  }, delayMs);
}

useStudioStore.subscribe(
  (state) => state.config,
  () => scheduleRender(1500),
  // Use referential equality — config is immutably updated so Object.is
  // correctly detects changes without the cost of JSON.stringify on every set.
  { equalityFn: Object.is }
);

// Trigger a final re-render when a drag ends so the Player picks up the
// committed transforms (CanvasOverlay reflects them live via CSS but the
// Remotion composition needs the bump to re-position text inside).
useStudioStore.subscribe(
  (state) => state.isDragging,
  (isDragging) => {
    if (!isDragging) {
      setTimeout(() => useStudioStore.getState().triggerRender(), 100);
    }
  }
);
