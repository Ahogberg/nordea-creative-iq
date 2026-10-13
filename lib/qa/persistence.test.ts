import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
const mocks = vi.hoisted(() => ({ db: vi.fn(), gate: vi.fn(), from: vi.fn() }));
vi.mock("@/lib/supabase/db", () => ({ requireDb: mocks.db }));
vi.mock("@/lib/qa/gate", () => ({ runQAGate: mocks.gate }));
import { POST as run } from "@/app/api/qa/run/route";
import { POST as approve } from "@/app/api/qa/[id]/approve/route";
function query(data: unknown, error: unknown = null) {
  const result = { data, error };
  const q = { select: vi.fn(), eq: vi.fn(), insert: vi.fn(), update: vi.fn(), is: vi.fn(), single: vi.fn(), maybeSingle: vi.fn(), then: (resolve: (r: typeof result) => unknown) => Promise.resolve(result).then(resolve) };
  for (const fn of [q.select, q.eq, q.insert, q.update, q.is]) fn.mockReturnValue(q);
  q.single.mockResolvedValue(result); q.maybeSingle.mockResolvedValue(result);
  return q;
}
const request = () => new Request("https://test/api/qa/run", { method: "POST", body: JSON.stringify({ creative_kind: "copy", creative_ref: "copy-1", metadata: { headline: "Hej" } }) });
const report = { status: "pass", total_score: 90, persona_jury: { aggregate_score: 90 }, tov: { weighted_score: 90 }, compliance: { score: 90 }, heatmap: null, warnings: [], suggestions: [], blocking_issues: [], duration_ms: 1 };
beforeEach(() => { vi.resetAllMocks(); vi.stubEnv("ANTHROPIC_API_KEY", "test-only"); mocks.db.mockResolvedValue({ supabase: { from: mocks.from }, ownerId: "owner", isDemo: false }); mocks.gate.mockResolvedValue(structuredClone(report)); });
describe("persisted QA", () => {
  it("requires login before any database or AI work", async () => { mocks.db.mockResolvedValue({ response: NextResponse.json({}, { status: 401 }) }); expect((await run(request())).status).toBe(401); expect(mocks.from).not.toHaveBeenCalled(); expect(mocks.gate).not.toHaveBeenCalled(); });
  it("does not run AI when the initial save fails", async () => { mocks.from.mockReturnValue(query(null, new Error("insert failed"))); expect((await run(request())).status).toBe(500); expect(mocks.gate).not.toHaveBeenCalled(); });
  it("does not return success if the final save fails", async () => { const final=query(null,new Error("update failed")); const failed=query(null); mocks.from.mockReturnValueOnce(query({ id: "run-1", created_at: "now" })).mockReturnValueOnce(final).mockReturnValueOnce(failed); expect((await run(request())).status).toBe(500); expect(failed.update).toHaveBeenCalledWith(expect.objectContaining({ status: "error" })); expect(final.eq).toHaveBeenCalledWith("user_id", "owner"); });
  it("marks a provider failure as error", async () => { const failed=query(null); mocks.from.mockReturnValueOnce(query({ id: "run-1" })).mockReturnValueOnce(failed); mocks.gate.mockRejectedValue(new Error("provider down")); expect((await run(request())).status).toBe(500); expect(failed.update).toHaveBeenCalledWith(expect.objectContaining({ status: "error" })); });
  it("missing AI key cannot produce a completed approval", async () => { vi.stubEnv("ANTHROPIC_API_KEY", ""); const final=query({ id: "run-1" }); mocks.from.mockReturnValueOnce(query({ id: "run-1", created_at: "now" })).mockReturnValueOnce(final); const response=await run(request()); expect((await response.json()).status).toBe("error"); expect(final.update).toHaveBeenCalledWith(expect.objectContaining({ status: "error", heatmap_score: null })); });
  it("refuses manual approval of a blocked result", async () => { const fetch=query({ status: "warn", approved_at: null, blocking_issues: ["blocked"] }); mocks.from.mockReturnValue(fetch); expect((await approve(new Request("https://test", {method:"POST",body:"{}"}),{params:Promise.resolve({id:"run-1"})})).status).toBe(400); expect(fetch.update).not.toHaveBeenCalled(); });
  it("detects concurrent changes when approving", async () => { const update=query(null); mocks.from.mockReturnValueOnce(query({status:"warn",approved_at:null,blocking_issues:[]})).mockReturnValueOnce(update); expect((await approve(new Request("https://test",{method:"POST",body:"{}"}),{params:Promise.resolve({id:"run-1"})})).status).toBe(409); expect(update.eq).toHaveBeenCalledWith("user_id","owner"); expect(update.eq).toHaveBeenCalledWith("status","warn"); expect(update.is).toHaveBeenCalledWith("approved_at",null); });
});
