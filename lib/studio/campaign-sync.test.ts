import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { VideoConfig } from "@/lib/remotion/types";

const config = (title: string): VideoConfig => ({
  id: title, title, format: "story", backgroundColor: "#0000A0", accentColor: "#40BFA3",
  scenes: [], showLogo: true, totalDurationSeconds: 0,
});
const campaignResponse = (id: string, video: VideoConfig | null = config(id)) =>
  Response.json({ campaign: { id, name: id, video_config: video, display_set: null } });

let sync: typeof import("./campaign-sync");
let store: typeof import("./store").useStudioStore;
let request: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.stubGlobal("window", { addEventListener: vi.fn() });
  request = vi.fn();
  vi.stubGlobal("fetch", request);
  store = (await import("./store")).useStudioStore;
  sync = await import("./campaign-sync");
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("campaign saves", () => {
  it("marks edits as pending before the debounce runs", async () => {
    request.mockResolvedValue(campaignResponse("a"));
    await sync.openCampaign("a");
    store.setState({ config: config("edited") });
    expect(store.getState().campaignSave).toBe("pending");
    expect(sync.hasUnsavedCampaignChanges()).toBe(true);
  });

  it("serializes writes and drains edits made during an active save", async () => {
    request.mockResolvedValueOnce(campaignResponse("a"));
    await sync.openCampaign("a");
    let finish!: (response: Response) => void;
    request.mockImplementationOnce(() => new Promise<Response>((resolve) => { finish = resolve; }));
    request.mockResolvedValueOnce(Response.json({}));
    store.setState({ config: config("first") });
    const flush = sync.flushCampaignSave();
    store.setState({ config: config("latest") });
    expect(sync.flushCampaignSave()).toBe(flush);
    expect(request).toHaveBeenCalledTimes(2);
    finish(Response.json({}));
    expect(await flush).toBe(true);
    expect(request).toHaveBeenCalledTimes(3);
    expect(JSON.parse(request.mock.calls[2][1].body).video_config.title).toBe("latest");
    expect(store.getState().campaignSave).toBe("saved");
    expect(sync.hasUnsavedCampaignChanges()).toBe(false);
  });

  it("keeps the old campaign and unsaved changes when switching fails to save", async () => {
    request.mockResolvedValueOnce(campaignResponse("a"));
    await sync.openCampaign("a");
    const edited = config("unsaved");
    store.setState({ config: edited });
    request.mockResolvedValueOnce(Response.json({ error: "Offline" }, { status: 500 }));
    await sync.openCampaign("b");
    expect(store.getState().campaign?.id).toBe("a");
    expect(store.getState().config).toBe(edited);
    expect(store.getState().campaignLoad?.status).toBe("error");
    expect(request).toHaveBeenCalledTimes(2);
    request.mockResolvedValueOnce(Response.json({}));
    expect(await sync.flushCampaignSave()).toBe(true);
  });

  it("opens an empty campaign without another campaign's example video", async () => {
    request.mockResolvedValueOnce(campaignResponse("a"));
    await sync.openCampaign("a");
    request.mockResolvedValueOnce(campaignResponse("b", null));
    await sync.openCampaign("b");
    expect(store.getState().config.scenes).toEqual([]);
    expect(store.getState().config.title).toBe("b");
    expect(store.getState().campaign?.id).toBe("b");
  });

  it("ignores an old load that resolves after the newer campaign", async () => {
    let finish!: (response: Response) => void;
    request.mockImplementationOnce(() => new Promise<Response>((resolve) => { finish = resolve; }));
    const old = sync.openCampaign("a");
    request.mockResolvedValueOnce(campaignResponse("b"));
    await sync.openCampaign("b");
    finish(campaignResponse("a"));
    await old;
    expect(store.getState().campaign?.id).toBe("b");
    expect(store.getState().config.title).toBe("b");
  });

  it("persists clearing a display set as null", async () => {
    request.mockResolvedValueOnce(Response.json({ campaign: { id: "a", name: "a", video_config: config("a"), display_set: { id: "display" } } }));
    await sync.openCampaign("a");
    store.getState().setDisplay(null);
    request.mockResolvedValueOnce(Response.json({}));
    expect(await sync.flushCampaignSave()).toBe(true);
    expect(JSON.parse(request.mock.calls[1][1].body)).toEqual({ display_set: null });
  });
});
