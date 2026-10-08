import { describe, expect, it } from "vitest";
import { CampaignChoicesSchema, channelName, formatName, isChannel, isFormat } from "./campaign-options";

describe("CampaignChoicesSchema", () => {
  it("godtar kända kanaler och format och behåller ordningen", () => {
    const parsed = CampaignChoicesSchema.parse({ channels: ["tiktok", "meta"], formats: ["feed", "story"] });
    expect(parsed).toEqual({ channels: ["tiktok", "meta"], formats: ["feed", "story"] });
  });

  it("tar bort dubbletter", () => {
    const parsed = CampaignChoicesSchema.parse({ channels: ["meta", "meta"], formats: ["story", "story", "feed"] });
    expect(parsed.channels).toEqual(["meta"]);
    expect(parsed.formats).toEqual(["story", "feed"]);
  });

  it("kräver minst en kanal och ett format", () => {
    expect(CampaignChoicesSchema.safeParse({ channels: [], formats: ["story"] }).success).toBe(false);
    expect(CampaignChoicesSchema.safeParse({ channels: ["meta"], formats: [] }).success).toBe(false);
    expect(CampaignChoicesSchema.safeParse({}).success).toBe(false);
  });

  it("avvisar okända värden", () => {
    expect(CampaignChoicesSchema.safeParse({ channels: ["myspace"], formats: ["story"] }).success).toBe(false);
    expect(CampaignChoicesSchema.safeParse({ channels: ["meta"], formats: ["21:9"] }).success).toBe(false);
  });
});

describe("namn och typvakter", () => {
  it("känner igen id:n", () => {
    expect(isChannel("linkedin")).toBe(true);
    expect(isChannel("print")).toBe(false);
    expect(isFormat("landscape")).toBe(true);
    expect(isFormat("square")).toBe(false);
  });

  it("ger svenska namn och faller tillbaka på id:t", () => {
    expect(channelName("meta")).toBe("Meta / Instagram");
    expect(formatName("story")).toBe("Story / Reel · 9:16");
    expect(channelName("okänd")).toBe("okänd");
  });
});
