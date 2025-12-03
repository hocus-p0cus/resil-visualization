import { describe, test, expect } from "vitest";
import { hierarchicalLayout, collectNodes } from "../src/testables";
import { loadEdges } from "./helpers/dataHelpers";
import { realDataTestCases } from "./fixtures/testCases";

function buildSubgraph(target, downEdges, nonResilEdges) {
  // Prepare up edges
  const upEdges = downEdges.map(([a, b]) => [b, a]);
  const upNonResil = nonResilEdges.map(([a, b]) => [b, a]);

  // Collect reachable nodes
  const upNodes = collectNodes(target, [...upEdges, ...upNonResil]);
  const downNodes = collectNodes(target, [...downEdges, ...nonResilEdges]);
  
  // Combined set
  const allNodes = new Set([...upNodes, ...downNodes]);

  // Extract subgraph edges (down + nonresil)
  const fullDown = [...downEdges, ...nonResilEdges];
  const subEdges = fullDown.filter(([u, v]) =>
    allNodes.has(u) && allNodes.has(v)
  );

  // Sort nodes for determinism
  const nodeList = [...allNodes].sort();

  return { nodeList, subEdges };
}

describe.each(realDataTestCases)(
  "real hierarchical layout – $region $season resi$keyLevel – $type: $target",
  (params) => {
    
    test("layout snapshot", async () => {
      const { region, season, keyLevel, target } = params;

      const { downEdges, nonResilEdges } = await loadEdges(params);

      const { nodeList, subEdges } = buildSubgraph(
        target,
        downEdges,
        nonResilEdges
      );

      const layout = hierarchicalLayout(nodeList, subEdges);

      // Structural checks
      expect(layout.pos).toBeDefined();
      expect(layout.layers).toBeDefined();

      // All nodes have valid positions
      nodeList.forEach(node => {
        expect(layout.pos[node]).toBeDefined();
        expect(layout.pos[node].x).toBeTypeOf('number');
        expect(layout.pos[node].y).toBeTypeOf('number');
        expect(isFinite(layout.pos[node].x)).toBe(true);
        expect(isFinite(layout.pos[node].y)).toBe(true);
      });

      // All nodes appear exactly once across layers
      const allLayerNodes = layout.layers.flat().sort();
      expect(allLayerNodes).toEqual(nodeList);

      // Layers are non-empty
      layout.layers.forEach(layer => {
        expect(layer.length).toBeGreaterThan(0);
      });

      // Hierarchical constraint: edges go from lower to higher y
      subEdges.forEach(([from, to]) => {
        const fromY = layout.pos[from].y;
        const toY = layout.pos[to].y;
        expect(fromY).toBeLessThan(toY);
      });

      expect(layout).toMatchSnapshot();
    });
  }
);
