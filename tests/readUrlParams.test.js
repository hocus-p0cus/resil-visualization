import { describe, test, expect, beforeEach } from "vitest";
import { readUrlParams } from "../src/readUrlParams";

function setSearch(search) {
  Object.defineProperty(window, "location", {
    writable: true,
    value: { search }
  });
}

describe("readUrlParams", () => {
  beforeEach(() => {
    setSearch(""); // reset before each test
  });

  test("parses full URL parameter set", () => {
    setSearch("?region=EU&season=tww-s2&character=graliboar&realm=tarren-mill&level=20");

    const result = readUrlParams();
    expect(result).toEqual({
      region: "eu",
      season: "tww-s2",
      character: "graliboar",
      realm: "tarren-mill",
      level: 20
    });
  });

  test("returns null for missing parameters", () => {
    setSearch("?season=tww-s2");

    const result = readUrlParams();
    expect(result).toEqual({
      region: null,
      season: "tww-s2",
      character: null,
      realm: null,
      level: null
    });
  });

  test("handles mixed-case and upper-case inputs", () => {
    setSearch("?region=EU&character=NNOGGIE&realm=TaRrEn-MiLl");

    const result = readUrlParams();
    expect(result).toMatchObject({
      region: "eu",
      character: "nnoggie",
      realm: "tarren-mill"
    });
  });

  test("numeric parsing of level", () => {
    setSearch("?level=19");
    expect(readUrlParams().level).toBe(19);
  });

  test("non-numeric level returns NaN", () => {
    setSearch("?level=abc");
    expect(readUrlParams().level).toBeNaN();
  });

  test("URL-encoded characters decoded automatically", () => {
    setSearch("?character=Th%C3%B3r%C3%ADndal");
    expect(readUrlParams().character).toBe("thóríndal");
  });

  test("empty parameter values return null", () => {
    setSearch("?region=&character=");
    expect(readUrlParams()).toMatchObject({
      region: null,
      character: null
    });
  });

  test("ignores unknown URL parameters", () => {
    setSearch("?foo=bar&season=s3");
    expect(readUrlParams()).toMatchObject({
      season: "s3",
      region: null
    });
  });
});