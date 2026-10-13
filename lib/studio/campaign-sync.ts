"use client";

import { useStudioStore } from "./store";
import { DEFAULT_VIDEO_CONFIG, DEFAULT_MOTION_CONFIG, type VideoConfig } from "@/lib/remotion/types";
import type { DisplaySet } from "@/lib/display/types";

const SAVE_DELAY_MS = 1500;
let savedConfig: VideoConfig | null = null;
let savedDisplay: DisplaySet | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let loadingId: string | null = null;
let loadVersion = 0;
let saving: Promise<boolean> | null = null;

export async function openCampaign(id: string): Promise<void> {
  const state = useStudioStore.getState();
  if (state.campaign?.id === id || loadingId === id) return;
  const version = ++loadVersion;
  loadingId = id;
  useStudioStore.setState({ campaignLoad: { id, status: "loading" } });
  try {
    // A failed save must leave the current campaign and edits intact.
    if (state.campaign && !(await flushCampaignSave())) {
      throw new Error("Ändringarna kunde inte sparas. Försök igen innan du byter kampanj.");
    }
    if (version !== loadVersion) return;
    const res = await fetch(`/api/campaigns/${id}`);
    const data = (await res.json().catch(() => null)) as {
      campaign?: { id: string; name: string; video_config: VideoConfig | null; display_set: DisplaySet | null };
      error?: string;
    } | null;
    if (version !== loadVersion) return;
    if (!res.ok || !data?.campaign) throw new Error(data?.error || "Kampanjen kunde inte öppnas");
    const c = data.campaign;
    // Never carry another campaign's video into an empty campaign.
    const config = c.video_config ?? {
      ...DEFAULT_VIDEO_CONFIG, id: c.id, title: c.name, scenes: [], totalDurationSeconds: 0,
    };
    const next = { ...config, motion: config.motion ?? DEFAULT_MOTION_CONFIG };
    if (timer) clearTimeout(timer);
    timer = null;
    savedConfig = next;
    savedDisplay = c.display_set ?? null;
    useStudioStore.setState({ campaign: null });
    useStudioStore.getState().loadConfig(next);
    savedConfig = useStudioStore.getState().config;
    useStudioStore.getState().setDisplay(savedDisplay);
    useStudioStore.setState({ campaign: { id: c.id, name: c.name }, campaignSave: "saved", campaignLoad: null });
    useStudioStore.getState().clearHistory();
  } catch (err) {
    if (version !== loadVersion) return;
    useStudioStore.setState({
      campaignLoad: { id, status: "error", message: err instanceof Error ? err.message : "Kampanjen kunde inte öppnas" },
    });
  } finally {
    if (version === loadVersion) loadingId = null;
  }
}

export function hasUnsavedCampaignChanges(): boolean {
  const { campaign, config, display } = useStudioStore.getState();
  return !!campaign && (config !== savedConfig || display !== savedDisplay);
}

async function saveLatest(): Promise<boolean> {
  // Serialize writes: a slow older request must never overwrite newer edits.
  while (hasUnsavedCampaignChanges()) {
    const { campaign, config, display } = useStudioStore.getState();
    if (!campaign) return true;
    const body: { video_config?: VideoConfig; display_set?: DisplaySet | null } = {};
    if (config !== savedConfig) body.video_config = config;
    if (display !== savedDisplay) body.display_set = display;
    useStudioStore.setState({ campaignSave: "saving" });
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "Kunde inte spara");
      if (useStudioStore.getState().campaign?.id !== campaign.id) return true;
      savedConfig = config;
      savedDisplay = display;
    } catch (err) {
      console.error("[campaign-sync] sparning misslyckades:", err);
      if (useStudioStore.getState().campaign?.id === campaign.id) useStudioStore.setState({ campaignSave: "error" });
      return false;
    }
  }
  if (useStudioStore.getState().campaign) useStudioStore.setState({ campaignSave: "saved" });
  return true;
}

export function flushCampaignSave(): Promise<boolean> {
  if (timer) clearTimeout(timer);
  timer = null;
  if (saving) return saving;
  saving = saveLatest().finally(() => { saving = null; });
  return saving;
}

function schedule() {
  if (!useStudioStore.getState().campaign) return;
  useStudioStore.setState({ campaignSave: "pending" });
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void flushCampaignSave(), SAVE_DELAY_MS);
}

/** Call only after a successful flush. The video remains available locally. */
export function closeCampaign() {
  if (timer) clearTimeout(timer);
  timer = null;
  savedConfig = null;
  savedDisplay = null;
  useStudioStore.setState({ campaign: null, campaignSave: "idle" });
}

if (typeof window !== "undefined") {
  useStudioStore.subscribe((s) => s.config, schedule, { equalityFn: Object.is });
  useStudioStore.subscribe((s) => s.display, schedule, { equalityFn: Object.is });
  window.addEventListener("beforeunload", (event) => {
    if (!hasUnsavedCampaignChanges()) return;
    event.preventDefault();
    event.returnValue = "";
  });
}
