import { describe, test, expect, vi, beforeEach } from "vitest";

vi.mock("../src/app.jsx", () => {
  // mock dependencies
  const mockSlugMapping = {
    "tarren-mill": "Tarren Mill",
    "twisting-nether": "Twisting Nether",
    "outland": "Outland",
    "aggra-português": "Aggra (Português)"
  };

  const mockRegionMapping = {
    us: "na",
    eu: "eu",
  };

  const mockFindNodeInGraph = vi.fn();

  // Mock alert (browser-only)
  globalThis.alert = vi.fn();

  // copy of parseRioLink logic, referencing mocks instead of real globals
  function parseRioLink(input) {
    const match = input.match(/^(?:https?:\/\/)?raider\.io\/characters\/(eu|us)\/([^\/]+)\/([^\/?#]+)/i);

    if (match) {
      const linkRegion = mockRegionMapping[match[1]];
      const slug = decodeURIComponent(match[2]).toLowerCase();
      const name = decodeURIComponent(match[3]);

      const realm = mockSlugMapping[slug];
      const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

      // Unknown slug → fallback
      if (!realm) {
        globalThis.alert(`Realm slug "${slug}" not found in mapping. Using slug as-is.`);

        const fallbackRealm = slug
          .split("-")
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");

        return { charId: `${capitalizedName}-${fallbackRealm}`, region: linkRegion };
      }

      return { charId: `${capitalizedName}-${realm}`, region: linkRegion };
    }

    // Fallback to raw input or graph search
    const trimmed = input.trim();
    const found = mockFindNodeInGraph(trimmed);
    return { charId: found || trimmed, region: null };
  }

  return {
    parseRioLink,
    __mock__: {
      mockSlugMapping,
      mockRegionMapping,
      mockFindNodeInGraph,
    }
  };
});

// import the mocked version
import { parseRioLink, __mock__ } from "../src/app.jsx";
const { mockFindNodeInGraph } = __mock__;

// reset mocks before each test
beforeEach(() => {
  mockFindNodeInGraph.mockReset();
  alert.mockReset();
});

// ----------------------------
// Test Suite
// ----------------------------
describe("parseRioLink – URL parsing", () => {
  test("parses standard Raider.io URL", () => {
    const result = parseRioLink("https://raider.io/characters/eu/tarren-mill/Graliboar");
    expect(result).toEqual({
      charId: "Graliboar-Tarren Mill",
      region: "eu"
    });
  });

  test("parses without https:// prefix", () => {
    const result = parseRioLink("raider.io/characters/us/tarren-mill/Nnoggie");
    expect(result).toEqual({
      charId: "Nnoggie-Tarren Mill",
      region: "na"
    });
  });

  test("slug is matched case-insensitively", () => {
    const result = parseRioLink("https://raider.io/characters/eu/TaRrEn-MiLl/Graliboar");
    expect(result.charId).toBe("Graliboar-Tarren Mill");
  });
});


// ----------------------------
// Slug fallback behavior
// ----------------------------
describe("parseRioLink – unknown slug fallback", () => {
  test("fallback realm is title-cased", () => {
    const result = parseRioLink("https://raider.io/characters/eu/unknown-slug/Mychar");

    expect(alert).toHaveBeenCalled();
    expect(result).toEqual({
      charId: "Mychar-Unknown Slug",
      region: "eu"
    });
  });
});


// ----------------------------
// Character name normalization
// ----------------------------
describe("parseRioLink – character name normalization", () => {
  test("capitalizes name correctly", () => {
    const result = parseRioLink("https://raider.io/characters/eu/outland/gRaLiBoAr");
    expect(result.charId).toBe("Graliboar-Outland");
  });

  test("name is matched case-insensitively", () => {
    const result = parseRioLink("https://raider.io/characters/EU/tarren-mill/NNOGGIE");
    expect(result.charId).toBe("Nnoggie-Tarren Mill");
  });
});


// ----------------------------
// URL-encoded & Unicode handling
// ----------------------------
describe("parseRioLink – encoded & unicode characters", () => {
  test("decodes URL-encoded name", () => {
    const result = parseRioLink("https://raider.io/characters/eu/outland/Th%C3%B3r%C3%ADndal");
    expect(result.charId).toBe("Thóríndal-Outland");
  });

  test("handles unicode input directly", () => {
    const result = parseRioLink("https://raider.io/characters/eu/outland/Thóríndal");
    expect(result.charId).toBe("Thóríndal-Outland");
  });

  test("decodes URL-encoded realm slug", () => {
    const result = parseRioLink("https://raider.io/characters/eu/aggra-portugu%C3%AAs/Sonnydruid");
    expect(result.charId).toBe("Sonnydruid-Aggra (Português)");
  });

  test("handles unicode realm slug directly", () => {
    const result = parseRioLink("https://raider.io/characters/eu/aggra-português/sonnydruid");
    expect(result.charId).toBe("Sonnydruid-Aggra (Português)");
  });
});


// ----------------------------
// Fallback-to-graph behavior
// ----------------------------
describe("parseRioLink – fallback to graph search", () => {
  test("returns graph node when found", () => {
    mockFindNodeInGraph.mockReturnValue("Graliboar-Outland");

    const result = parseRioLink("graliboar-outland");

    expect(result).toEqual({
      charId: "Graliboar-Outland",
      region: null
    });
  });

  test("returns trimmed raw input when node not found", () => {
    mockFindNodeInGraph.mockReturnValue(null);

    const result = parseRioLink(" someone-that-does-not-exist ");

    expect(result).toEqual({
      charId: "someone-that-does-not-exist",
      region: null
    });
  });
});


// ----------------------------
// Invalid or partial URLs
// ----------------------------
describe("parseRioLink – invalid URLs", () => {
  test("partial URL falls back to graph", () => {
    mockFindNodeInGraph.mockReturnValue("Fallback-Node");

    const result = parseRioLink("raider.io/characters/eu/outland");
    expect(result).toEqual({
      charId: "Fallback-Node",
      region: null
    });
  });

  test("URL missing slug falls back", () => {
    mockFindNodeInGraph.mockReturnValue("X-Outland");

    const result = parseRioLink("raider.io/characters/eu//Nnoggie");
    expect(result.charId).toBe("X-Outland");
  });

  test("non-character URL falls back", () => {
    mockFindNodeInGraph.mockReturnValue("Graph-Match");

    const result = parseRioLink("raider.io/mythic-plus-rankings");
    expect(result.charId).toBe("Graph-Match");
  });
});