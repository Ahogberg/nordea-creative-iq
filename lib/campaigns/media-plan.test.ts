import { beforeEach, describe, expect, it, vi } from "vitest";
import { MediaPlanSchema } from "./media-plan";
const mocked = vi.hoisted(() => ({ requireDb: vi.fn() }));
vi.mock("@/lib/supabase/db", () => ({ requireDb: mocked.requireDb }));
import { GET, POST } from "@/app/api/campaigns/[id]/media-plan/route";
const id = "12345678-1234-4234-8234-123456789012";
const params = { params: Promise.resolve({ id }) };
const plan = { budget: 100000, duration_days: 30, channel_mix: Object.fromEntries(["meta", "youtube", "tiktok", "display", "linkedin"].map(k => [k, { enabled: true, allocation: 20 }])), audience: { size: 10000, ageMin: 25, ageMax: 40 } };
const request = (body: unknown) => new Request(`http://localhost/api/campaigns/${id}/media-plan`, { method: "POST", body: JSON.stringify(body) });
let stored: unknown;
let writes: ReturnType<typeof vi.fn>;
let from: ReturnType<typeof vi.fn>;
beforeEach(() => {
  stored = null;
  writes = vi.fn(async row => { stored = row; return { error: null }; });
  from = vi.fn(table => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn(async () => ({ data: table === "campaigns" ? { id, name: "Test" } : stored, error: null })), upsert: writes }));
  mocked.requireDb.mockResolvedValue({ supabase: { from }, ownerId: "owner", isDemo: false });
});
describe("campaign-linked media plan", () => {
  it("validates allocation and age ranges", () => {
    expect(MediaPlanSchema.safeParse(plan).success).toBe(true);
    expect(MediaPlanSchema.safeParse({ ...plan, audience: { ...plan.audience, ageMin: 50 } }).success).toBe(false);
    expect(MediaPlanSchema.safeParse({ ...plan, channel_mix: { ...plan.channel_mix, meta: { enabled: true, allocation: 10 } } }).success).toBe(false);
  });
  it("requires a session", async () => {
    mocked.requireDb.mockResolvedValue({ response: Response.json({}, { status: 401 }) });
    expect((await POST(request(plan), params)).status).toBe(401);
    expect(writes).not.toHaveBeenCalled();
  });
  it("does not write through the demo service client", async () => {
    mocked.requireDb.mockResolvedValue({ isDemo: true });
    expect((await POST(request(plan), params)).status).toBe(503);
    expect(from).not.toHaveBeenCalled();
  });
  it("checks campaign ownership before saving", async () => {
    from.mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn(async () => ({ data: null, error: null })) });
    expect((await POST(request(plan), params)).status).toBe(404);
    expect(writes).not.toHaveBeenCalled();
  });
  it("rejects invalid plans without writes", async () => {
    expect((await POST(request({ ...plan, budget: -1 }), params)).status).toBe(400);
    expect(writes).not.toHaveBeenCalled();
  });
  it("roundtrips the saved plan under the campaign id and owner", async () => {
    expect((await POST(request(plan), params)).status).toBe(200);
    expect(writes).toHaveBeenCalledWith(expect.objectContaining({ id, user_id: "owner", name: "Test" }), { onConflict: "id" });
    const result = await GET(new Request("http://localhost"), params);
    expect((await result.json()).plan).toEqual(plan);
  });
});
