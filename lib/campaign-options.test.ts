import { describe, expect, it } from "vitest";
import { parseCampaignChoices } from "./campaign-options";
import { runHeatmapPrediction } from "./qa/heatmap";
describe("campaign choices", () => {
 it("rejects empty, malformed and unsupported choices", () => { for (const value of [null,{}, {channels:[],formats:["story"]},{channels:["meta"],formats:[]},{channels:["unknown"],formats:["story"]},{channels:["meta"],formats:["9:16"]}]) expect(parseCampaignChoices(value)).toBeNull(); });
 it("keeps each supported choice once in selection order", () => { expect(parseCampaignChoices({channels:["meta","meta","youtube"],formats:["story","landscape","story"]})).toEqual({channels:["meta","youtube"],formats:["story","landscape"]}); });
});
it("does not simulate attention from text alone", async () => { expect(await runHeatmapPrediction({has_headline:true,has_cta:true})).toBeNull(); });
