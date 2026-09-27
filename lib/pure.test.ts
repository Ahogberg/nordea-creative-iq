import { describe, expect, it } from "vitest";
import { campaignStatus, formatRelative } from "./campaign-status";
import { greetingName, userDisplay } from "./auth/user-display";
import { summarize } from "./audience/aggregate";

describe("campaignStatus", () => {
  it("ger etikett och ton per status", () => {
    expect(campaignStatus("in_review")).toEqual({ label: "Under granskning", tone: "amber" });
    expect(campaignStatus("approved").tone).toBe("green");
  });

  it("faller tillbaka på utkast för okänt eller saknat värde", () => {
    expect(campaignStatus(null).label).toBe("Utkast");
    expect(campaignStatus("okänd").label).toBe("Utkast");
  });
});

describe("formatRelative", () => {
  const now = Date.parse("2026-09-27T12:00:00Z");
  it.each([
    ["2026-09-27T11:59:40Z", "just nu"],
    ["2026-09-27T11:48:00Z", "12 min sedan"],
    ["2026-09-27T09:00:00Z", "3 h sedan"],
    ["2026-09-25T12:00:00Z", "2 d sedan"],
  ])("%s → %s", (iso, expected) => {
    expect(formatRelative(iso, now)).toBe(expected);
  });
});

describe("userDisplay", () => {
  const u = (email: string, extra: Record<string, unknown> = {}) => ({ id: "u1", email, user_metadata: extra });

  it("tolkar fornamn.efternamn@nordea.com", () => {
    expect(userDisplay(u("anna.lindqvist@nordea.com"))).toEqual({
      name: "Anna Lindqvist",
      initials: "AL",
      email: "anna.lindqvist@nordea.com",
    });
    expect(greetingName(u("anna.lindqvist@nordea.com"))).toBe("Anna");
  });

  it("föredrar fullständigt namn från profilen", () => {
    expect(userDisplay(u("x@nordea.com", { full_name: "Erik Svensson" })).initials).toBe("ES");
  });

  it("hälsar utan namn i demoläget och för adresser med siffror", () => {
    expect(greetingName({ id: "demo", email: "demo@nordea.com", user_metadata: {} })).toBeNull();
    expect(userDisplay({ id: "demo", email: "demo@nordea.com", user_metadata: {} }).name).toBe("Demoanvändare");
    expect(greetingName(u("ab12345@nordea.com"))).toBeNull();
  });
});

describe("summarize", () => {
  it("räknar snitt, spridning och min/max", () => {
    expect(summarize([40, 50, 60])).toEqual({ mean: 50, min: 40, max: 60, sd: 10, n: 3 });
  });

  it("tom lista ger nollor i stället för NaN", () => {
    expect(summarize([])).toEqual({ mean: 0, min: 0, max: 0, sd: 0, n: 0 });
  });
});
