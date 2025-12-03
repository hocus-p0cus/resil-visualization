import { describe, test, expect, beforeEach } from "vitest";

import {
  parseCharacterInput,
  parseProfileURL,
  parseNameRealm,
  resolveRealm,
  findNode,
} from "../src/parseCharacterInput.js";

// -----------------------------
// Mocks / Fixtures
// -----------------------------

const slugMapping = {
  "tarren-mill": "Tarren Mill",
  "twisting-nether": "Twisting Nether",
  "outland": "Outland",
  "aggra-português": "Aggra (Português)",
};

const mkEdges = (pairs) =>
  pairs.map(([a, b]) => ({ source: a, target: b }));

let downEdges = [];
let nonResilEdges = [];

// Reset before each test
beforeEach(() => {
  downEdges = [];
  nonResilEdges = [];
});

// -------------------------------------------------------------
// parseProfileURL (pure URL parsing)
// -------------------------------------------------------------

describe("parseProfileURL", () => {
  test("parses standard Raider.io URL", () => {
    const result = parseProfileURL(
      "https://raider.io/characters/eu/tarren-mill/graliboar"
    );

    expect(result).toEqual({
      region: "eu",
      name: "graliboar",
      realmSlug: "tarren-mill",
    });
  });

  test("parses URL without protocol", () => {
    const result = parseProfileURL(
      "raider.io/characters/us/outland/nnoggie"
    );

    expect(result).toMatchObject({
      region: "na",
      name: "nnoggie",
      realmSlug: "outland",
    });
  });

  test("parses URL-encoded name", () => {
    const result = parseProfileURL(
      "https://raider.io/characters/eu/outland/Th%C3%B3r%C3%ADndal"
    );

    expect(result.name).toBe("thóríndal");
  });

  test("returns null for invalid URLs", () => {
    expect(parseProfileURL("raider.io/mythic-plus")).toBeNull();
    expect(parseProfileURL("not-even-a-url")).toBeNull();
  });
});

// -------------------------------------------------------------
// resolveRealm
// -------------------------------------------------------------

describe("resolveRealm", () => {
  test("resolves known slugs using mapping", () => {
    expect(resolveRealm("tarren-mill", slugMapping)).toBe("tarren mill");
  });

  test("falls back gracefully for unknown slugs", () => {
    expect(resolveRealm("weird-realm-slug", slugMapping))
      .toBe("weird realm slug");
  });

  test("slugMapping = null → fallback to replace hyphens", () => {
    expect(resolveRealm("some-realm", null)).toBe("some realm");
  });
});

// -------------------------------------------------------------
// parseNameRealm
// -------------------------------------------------------------

describe("parseNameRealm", () => {
  test("parses name-realm properly", () => {
    expect(parseNameRealm("Graliboar-Outland")).toEqual({
      charId: "graliboar-outland",
    });
  });

  test("handles name with no realm", () => {
    expect(parseNameRealm("justname")).toEqual({ charId: "justname" });
  });

  test("lowercases everything", () => {
    expect(parseNameRealm("NnOgGiE-OuTlAnD")).toEqual({
      charId: "nnoggie-outland",
    });
  });
});

// -------------------------------------------------------------
// findNodeLowercase
// -------------------------------------------------------------

describe("findNode", () => {
  test("returns matching node when present", () => {
    downEdges = mkEdges([
      ["a", "b"],
      ["b", "c"],
    ]);

    const result = findNode("b", downEdges, []);
    expect(result).toBe("b");
  });

  test("returns null when not found", () => {
    downEdges = mkEdges([["a", "b"]]);
    expect(findNode("x", downEdges, [])).toBeNull();
  });
});

// -------------------------------------------------------------
// parseCharacterInput – integration
// -------------------------------------------------------------

describe("parseCharacterInput – URL cases", () => {
  test("full URL parsing", () => {
    const out = parseCharacterInput(
      "https://raider.io/characters/eu/tarren-mill/Graliboar",
      slugMapping,
      downEdges,
      nonResilEdges
    );

    expect(out).toEqual({
      charId: "graliboar-tarren mill",
      region: "eu",
    });
  });

  test("URL-encoded characters", () => {
    const out = parseCharacterInput(
      "https://raider.io/characters/eu/outland/Th%C3%B3r%C3%ADndal",
      slugMapping,
      downEdges,
      nonResilEdges
    );

    expect(out.charId).toBe("thóríndal-outland");
  });

  test("URL with unicode slug", () => {
    const out = parseCharacterInput(
      "https://raider.io/characters/eu/aggra-português/sonnydruid",
      slugMapping,
      downEdges,
      nonResilEdges
    );

    expect(out).toEqual({
      charId: "sonnydruid-aggra (português)",
      region: "eu",
    });
  });
});

// -------------------------------------------------------------
// parseCharacterInput – name-realm & fallback
// -------------------------------------------------------------

describe("parseCharacterInput – name-realm input", () => {
  test("parses character name + realm", () => {
    const out = parseCharacterInput(
      "Graliboar-Outland",
      slugMapping,
      downEdges,
      nonResilEdges
    );

    expect(out).toEqual({
      charId: "graliboar-outland",
      region: null,
    });
  });
});

describe("parseCharacterInput – graph fallback", () => {
  test("returns graph node when matched", () => {
    downEdges = mkEdges([["graliboar-outland", "someone"]]);

    const out = parseCharacterInput(
      "Graliboar-Outland",
      slugMapping,
      downEdges,
      nonResilEdges
    );

    expect(out.charId).toBe("graliboar-outland");
  });

  test("returns parsed value when graph has no match", () => {
    const out = parseCharacterInput(
      "Someone-Else",
      slugMapping,
      downEdges,
      nonResilEdges
    );

    expect(out.charId).toBe("someone-else");
  });
});

// -------------------------------------------------------------
// parseCharacterInput – invalid URL fallback
// -------------------------------------------------------------

describe("parseCharacterInput – invalid URLs", () => {
  test("falls back if URL is incomplete", () => {
    const out = parseCharacterInput(
      "raider.io/characters/eu/outland",
      slugMapping,
      downEdges,
      nonResilEdges
    );

    expect(out.region).toBeNull();
  });

  test("falls back if slug missing", () => {
    const out = parseCharacterInput(
      "raider.io/characters/eu//nnoggie",
      slugMapping,
      downEdges,
      nonResilEdges
    );

    expect(out.region).toBeNull();
    expect(out.charId).toBe("raider.io/characters/eu//nnoggie");
  });
});
