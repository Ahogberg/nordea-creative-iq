import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({db:vi.fn(),from:vi.fn()}));
vi.mock("@/lib/supabase/db",()=>({requireDb:mocks.db}));
vi.mock("@/lib/remotion/compile",()=>({compileCanvasScenes:vi.fn(async value=>value)}));
vi.mock("@/lib/ai/providers/cost-tracker",()=>({logGeneration:vi.fn()}));
import { POST } from "@/app/api/brief/[id]/generate-campaign/route";
function query(data:unknown,error:unknown=null){const result={data,error};const q={select:vi.fn(),eq:vi.fn(),in:vi.fn(),insert:vi.fn(),update:vi.fn(),single:vi.fn(),maybeSingle:vi.fn(),then:(resolve:(r:typeof result)=>unknown)=>Promise.resolve(result).then(resolve)};for(const fn of [q.select,q.eq,q.in,q.insert,q.update])fn.mockReturnValue(q);q.single.mockResolvedValue(result);q.maybeSingle.mockResolvedValue(result);return q;}
const id="12345678-1234-4234-8234-123456789012";
const call=(body:unknown)=>POST(new Request("https://test",{method:"POST",body:JSON.stringify(body)}),{params:Promise.resolve({id})});
beforeEach(()=>{vi.resetAllMocks();mocks.db.mockResolvedValue({supabase:{from:mocks.from},ownerId:"owner",isDemo:false});});
describe("campaign material generation",()=>{
 it("rejects unsupported formats without database work",async()=>{expect((await call({channels:["meta"],formats:["bad"]})).status).toBe(400);expect(mocks.from).not.toHaveBeenCalled();});
 it("preserves edited video, templates and master while adding a format",async()=>{const config={id:"edited",format:"story",scenes:[{type:"title",durationSeconds:6,headline:"My edit"}]};const campaign={id:"campaign-1",video_config:config,template_ids:["story-1","archived-1"],master_creative_ids:["master-1"]};const added=query({id:"landscape-1"});const updated=query({...campaign,template_ids:["story-1","landscape-1","archived-1"]});mocks.from.mockReturnValueOnce(query({id,title:"Campaign"})).mockReturnValueOnce(query(campaign)).mockReturnValueOnce(query([{id:"story-1",config},{id:"archived-1",config:{format:"feed"}}])).mockReturnValueOnce(added).mockReturnValueOnce(updated).mockReturnValueOnce(query(null));const response=await call({channels:["meta"],formats:["story","landscape"]});expect(response.status).toBe(200);expect(added.insert).toHaveBeenCalledWith(expect.objectContaining({user_id:"owner",config:{...config,format:"landscape"}}));expect(updated.update).toHaveBeenCalledWith(expect.objectContaining({video_config:config,template_ids:["story-1","landscape-1","archived-1"],master_creative_ids:["master-1"]}));expect(updated.eq).toHaveBeenCalledWith("created_by","owner");expect(mocks.from.mock.calls.flat()).not.toContain("master_creatives");});
 it("does not generate a replacement when campaign lookup fails",async()=>{mocks.from.mockReturnValueOnce(query({id,title:"Campaign"})).mockReturnValueOnce(query(null,new Error("lookup failed")));expect((await call({channels:["meta"],formats:["story"]})).status).toBe(500);expect(mocks.from).toHaveBeenCalledTimes(2);});
});
