import { describe, expect, it } from "vitest";
import { isNavActive, PRIMARY_NAV } from "./navigation";
describe("task navigation", () => {
  it("has exactly five main destinations", () => expect(PRIMARY_NAV).toHaveLength(5));
  it.each(["/templates", "/dam", "/produce", "/create/master"])("keeps %s under library", path => expect(isNavActive("/library", path)).toBe(true));
  it("keeps briefs under campaigns rather than standalone creation", () => {
    expect(isNavActive("/campaigns", "/create/brief/abc")).toBe(true);
    expect(isNavActive("/create", "/create/brief/abc")).toBe(false);
  });
});
