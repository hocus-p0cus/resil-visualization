import { describe, test, expect } from "vitest";
import { hierarchicalLayout } from "../src/hierarchicalLayout";

// Helper: verify layering correctness
function assertLayering(layout, edges) {
  const { layers } = layout;

  const layerIndex = {};
  layers.forEach((nodes, idx) => {
    nodes.forEach(n => {
      layerIndex[n] = idx;
    });
  });

  // Edge direction must respect layering
  edges.forEach(([u, v]) => {
    expect(layerIndex[v]).toBeGreaterThan(layerIndex[u]);
  });

  return layerIndex;
}

describe("hierarchicalLayout – snapshot integration tests", () => {

  test("diamond shape DAG", () => {
    const nodes = ["A", "B", "C", "D"];
    const edges = [
      ["A", "B"],
      ["A", "C"],
      ["B", "D"],
      ["C", "D"]
    ];

    const layout = hierarchicalLayout(nodes, edges);

    // basic correctness
    const layerIndex = assertLayering(layout, edges);
    expect(layerIndex["A"]).toBe(0);
    expect(layerIndex["D"]).toBe(2);

    // snapshot full layout object
    expect(layout).toMatchSnapshot();
  });

  test("wide branching layer", () => {
    const nodes = ["A", "B", "C", "D"];
    const edges = [
      ["A", "B"],
      ["A", "C"],
      ["A", "D"]
    ];

    const layout = hierarchicalLayout(nodes, edges);

    assertLayering(layout, edges);

    expect(layout).toMatchSnapshot();
  });

  test("long chain", () => {
    const nodes = ["A", "B", "C", "D", "E"];
    const edges = [
      ["A", "B"],
      ["B", "C"],
      ["C", "D"],
      ["D", "E"]
    ];

    const layout = hierarchicalLayout(nodes, edges);

    assertLayering(layout, edges);

    expect(layout).toMatchSnapshot();
  });

  test("single node", () => {
    const nodes = ["A"];
    const edges = [];

    const layout = hierarchicalLayout(nodes, edges);

    expect(layout).toMatchSnapshot();
  });

  test("returns null for cyclic graph", () => {
    const nodes = ["A", "B", "C"];
    const edges = [
      ["A", "B"],
      ["B", "C"],
      ["C", "A"]
    ];

    expect(hierarchicalLayout(nodes, edges)).toBeNull();
  });
});
