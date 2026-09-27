"use client";

// ── Studion ↔ kampanjen ──
//
// När en kampanj öppnas i Motion Studio (?campaign=<id>) laddas dess video och
// displaypaket in i storen, och varje ändring sparas tillbaka (1,5 s efter
// senaste ändringen). Utan öppen kampanj gör modulen ingenting.

import { useStudioStore } from "./store";
import { DEFAULT_MOTION_CONFIG, type VideoConfig } from "@/lib/remotion/types";
import type { DisplaySet } from "@/lib/display/types";

const SAVE_DELAY_MS = 1500;

// Det som senast lästes från eller sparades till kampanjen — ändringar mot
// detta sparas; laddningen själv räknas inte som en ändring.
let savedConfig: VideoConfig | null = null;
let savedDisplay: DisplaySet | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let loadingId: string | null = null;

export async function openCampaign(id: string): Promise<void> {
  const state = useStudioStore.getState();
  if (state.campaign?.id === id || loadingId === id) return;
  loadingId = id;
  useStudioStore.setState({ campaignLoad: { id, status: "loading" } });
  // En annan kampanj var öppen: spara klart den innan den byts ut.
  if (state.campaign) {
    await flushCampaignSave();
    closeCampaign();
  }
  try {
    const res = await fetch(`/api/campaigns/${id}`);
    const data = (await res.json().catch(() => null)) as {
      campaign?: { id: string; name: string; video_config: VideoConfig | null; display_set: DisplaySet | null };
      error?: string;
    } | null;
    if (!res.ok || !data?.campaign) throw new Error(data?.error || "Kampanjen kunde inte öppnas");
    const c = data.campaign;
    if (c.video_config) {
      useStudioStore.getState().loadConfig({ ...c.video_config, motion: c.video_config.motion ?? DEFAULT_MOTION_CONFIG });
    }
    useStudioStore.getState().setDisplay(c.display_set ?? null);
    savedConfig = useStudioStore.getState().config;
    savedDisplay = c.display_set ?? null;
    useStudioStore.setState({ campaign: { id: c.id, name: c.name }, campaignSave: "saved", campaignLoad: null });
    // Inläsningen är ingen ändring — ångra ska inte kunna gå tillbaka förbi den.
    useStudioStore.getState().clearHistory();
  } catch (err) {
    // Visas av CampaignGate.
    useStudioStore.setState({
      campaignLoad: {
        id,
        status: "error",
        message: err instanceof Error ? err.message : "Kampanjen kunde inte öppnas",
      },
    });
  } finally {
    loadingId = null;
  }
}

async function save(): Promise<void> {
  const { campaign, config, display } = useStudioStore.getState();
  if (!campaign) return;
  const body: Record<string, unknown> = {};
  if (config !== savedConfig) body.video_config = config;
  if (display !== savedDisplay && display) body.display_set = display;
  if (Object.keys(body).length === 0) return;
  useStudioStore.setState({ campaignSave: "saving" });
  try {
    const res = await fetch(`/api/campaigns/${campaign.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "Kunde inte spara");
    savedConfig = config;
    if (body.display_set) savedDisplay = display;
    // Ändrades något medan vi sparade väntar nästa sparning redan i kön.
    if (useStudioStore.getState().campaignSave === "saving") useStudioStore.setState({ campaignSave: "saved" });
  } catch (err) {
    console.error("[campaign-sync] sparning misslyckades:", err);
    useStudioStore.setState({ campaignSave: "error" });
  }
}

function schedule() {
  if (!useStudioStore.getState().campaign) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void save(), SAVE_DELAY_MS);
}

/** Spara direkt (t.ex. innan man lämnar sidan). */
export function flushCampaignSave(): Promise<void> {
  if (timer) clearTimeout(timer);
  timer = null;
  return save();
}

/** Stänger kampanjen i studion (videon ligger kvar). */
export function closeCampaign() {
  if (timer) clearTimeout(timer);
  timer = null;
  savedConfig = null;
  savedDisplay = null;
  useStudioStore.setState({ campaign: null, campaignSave: "idle" });
}

let subscribed = false;
if (!subscribed && typeof window !== "undefined") {
  subscribed = true;
  useStudioStore.subscribe((s) => s.config, schedule, { equalityFn: Object.is });
  useStudioStore.subscribe((s) => s.display, schedule, { equalityFn: Object.is });
}
