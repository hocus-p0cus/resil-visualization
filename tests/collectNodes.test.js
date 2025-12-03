import { describe, test, expect } from 'vitest';
import { collectNodes } from '../src/testables';

describe("collectNodes", () => {
  test("collects reachable nodes in a simple chain", () => {
    const edges = [
      ["A", "B"],
      ["B", "C"],
      ["C", "D"]
    ];

    const result = collectNodes("A", edges);
    expect([...result].sort()).toEqual(["A", "B", "C", "D"]);
  });

  test("returns only the starting node when no edges exist", () => {
    const edges = [];
    expect([...collectNodes("X", edges)]).toEqual(["X"]);
  });

  test("does not revisit nodes", () => {
    const edges = [
      ["A", "B"],
      ["B", "A"],
      ["B", "C"]
    ];
    expect([...collectNodes("A", edges)].sort()).toEqual(["A", "B", "C"]);
  });

  test("handles diamond pattern without duplicates", () => {
    const edges = [
        ["A", "B"],
        ["A", "C"],
        ["B", "D"],
        ["C", "D"]
    ];
    expect(collectNodes("A", edges).size).toBe(4);
  });

  test("handles disconnected components", () => {
    const edges = [
      ["A", "B"],
      ["C", "D"]
    ];
    expect([...collectNodes("A", edges)].sort()).toEqual(["A", "B"]);
  });
});