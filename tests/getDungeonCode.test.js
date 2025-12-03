import { describe, test, expect } from "vitest";
import { getDungeonCode } from "../src/testables";

describe("getDungeonCode", () => {
  test("extracts dungeon code before hash", () => {
    expect(getDungeonCode("PSF#21879582")).toBe("PSF");
    expect(getDungeonCode("BREW#21324393")).toBe("BREW");
  });

  test("trims spaces around dungeon code", () => {
    expect(getDungeonCode("  NOF  #222 ")).toBe("NOF");
  });

  test("returns null when no hash is present", () => {
    expect(getDungeonCode("PSF")).toBeNull();
    expect(getDungeonCode("")).toBeNull();
  });
});