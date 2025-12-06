import { describe, test, expect } from "vitest";
import { buildGraphCore } from "../src/buildGraphCore";
import { loadEdges } from "./helpers/dataHelpers";
import { realDataTestCases } from "./fixtures/testCases";

function convertToObjects(rawEdges) {
  return rawEdges.map(([source, target]) => ({
    source,
    target,
    labels: []
  }));
}

describe.each(realDataTestCases)(
  "buildGraphCore – $region $season resi$keyLevel – $type: $target",
  (params) => {

    test("builds valid graph with showNonResil = false", async () => {
      const { target } = params;

      // Load tuple-based edges
      const { downEdges, nonResilEdges } = await loadEdges(params);

      // Convert to object format expected by buildGraphCore
      const downObj = convertToObjects(downEdges);
      const nonResilObj = convertToObjects(nonResilEdges);

      const graph = buildGraphCore({
        target,
        downEdges: downObj,
        nonResilEdges: nonResilObj,
        showNonResil: false,
      });

      expect(graph).not.toBeNull();

      // Target must be present
      expect(graph.nodes).toContain(target);

      // All nodes must have positions
      graph.nodes.forEach(n => {
        expect(graph.positions[n]).toBeDefined();
        expect(graph.positions[n].x).toBeTypeOf("number");
        expect(graph.positions[n].y).toBeTypeOf("number");
      });

      // Edges reference only nodes in graph
      graph.edges.forEach(e => {
        expect(graph.nodes).toContain(e.from);
        expect(graph.nodes).toContain(e.to);
      });
    });

    test("non-resil toggle adds more edges", async () => {
      const { target } = params;

      const { downEdges, nonResilEdges } = await loadEdges(params);
      const downObj = convertToObjects(downEdges);
      const nonResilObj = convertToObjects(nonResilEdges);

      const off = buildGraphCore({
        target,
        downEdges: downObj,
        nonResilEdges: nonResilObj,
        showNonResil: false,
      });

      const on = buildGraphCore({
        target,
        downEdges: downObj,
        nonResilEdges: nonResilObj,
        showNonResil: true,
      });

      if (!off || !on) return; // skip cyclic cases

      expect(on.edges.length).toBeGreaterThanOrEqual(off.edges.length);
    });

    test("always includes non-resil edges TO target", async () => {
      const { target } = params;
      const { downEdges, nonResilEdges } = await loadEdges(params);

      const downObj = convertToObjects(downEdges);
      const nonResilObj = convertToObjects(nonResilEdges);

      const off = buildGraphCore({
        target,
        downEdges: downObj,
        nonResilEdges: nonResilObj,
        showNonResil: false,
      });

      if (!off) return;

      const nrToTarget = nonResilObj.filter(e => e.target === target);

      nrToTarget.forEach(e => {
        const found = off.edges.some(x => x.from === e.source && x.to === e.target);
        expect(found).toBe(true);
      });
    });

    test("snapshot basic structure", async () => {
      const { target } = params;

      const { downEdges, nonResilEdges } = await loadEdges(params);
      const downObj = convertToObjects(downEdges);
      const nonResilObj = convertToObjects(nonResilEdges);

      const off = buildGraphCore({
        target,
        downEdges: downObj,
        nonResilEdges: nonResilObj,
        showNonResil: false,
      });

      const on = buildGraphCore({
        target,
        downEdges: downObj,
        nonResilEdges: nonResilObj,
        showNonResil: true,
      });

      expect({
        off: off ? {
          nodes: off.nodes.sort(),
          edgeCount: off.edges.length,
          nonResil: off.edges.filter(e => e.type === "nonresil").length
        } : null,
        on: on ? {
          nodes: on.nodes.sort(),
          edgeCount: on.edges.length,
          nonResil: on.edges.filter(e => e.type === "nonresil").length
        } : null,
      }).toMatchSnapshot();
    });

  }
);


// -------------------------------
// Edge-case tests
// -------------------------------

describe("buildGraphCore edge cases", () => {
  test("null target", () => {
    expect(buildGraphCore({
      target: null,
      downEdges: [],
      nonResilEdges: [],
      showNonResil: false
    })).toBeNull();
  });

  test("null downEdges", () => {
    expect(buildGraphCore({
      target: "A",
      downEdges: null,
      nonResilEdges: [],
      showNonResil: false
    })).toBeNull();
  });

  test("null nonResilEdges", () => {
    expect(buildGraphCore({
      target: "A",
      downEdges: [],
      nonResilEdges: null,
      showNonResil: false
    })).toBeNull();
  });

  test("isolated node", () => {
    const graph = buildGraphCore({
      target: "Solo",
      downEdges: [],
      nonResilEdges: [],
      showNonResil: false
    });

    expect(graph.nodes).toEqual(["Solo"]);
    expect(graph.edges.length).toBe(0);
    expect(graph.positions["Solo"]).toBeDefined();
  });
});
