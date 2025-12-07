import { describe, test, expect } from "vitest";
import { collectNodes } from "../src/collectNodes";
import { loadEdges } from "./helpers/dataHelpers";
import { realDataTestCases } from "./fixtures/testCases";

function calculateDistances(target, edges) {
  const adj = {};
  edges.forEach(([a, b]) => {
    if (!adj[a]) adj[a] = [];
    adj[a].push(b);
  });

  const distances = { [target]: 0 };
  const queue = [target];
  
  while (queue.length > 0) {
    const node = queue.shift();
    const currentDist = distances[node];
    const neighbors = adj[node] || [];
    
    neighbors.forEach(neighbor => {
      if (!(neighbor in distances)) {
        distances[neighbor] = currentDist + 1;
        queue.push(neighbor);
      }
    });
  }
  
  return distances;
}

describe("collectNodes with maxDistance", () => {
  describe.each(realDataTestCases)(
    "$region $season resi$keyLevel – $type: $target",
    (params) => {
      test.each([1, 2, 3])("maxDistance=%i filters correctly", async (maxDist) => {
        const { target } = params;
        const { downEdges, nonResilEdges } = await loadEdges(params);

        const upEdges = downEdges.map(([a, b]) => [b, a]);
        const upNonResil = nonResilEdges.map(([a, b]) => [b, a]);
        const allUpEdges = [...upEdges, ...upNonResil];

        const collected = collectNodes(target, allUpEdges, maxDist);
        const distances = calculateDistances(target, allUpEdges);
        
        const allReachable = collectNodes(target, allUpEdges);

        allReachable.forEach(node => {
          const actualDistance = distances[node];
          const wasCollected = collected.has(node);
          
          if (wasCollected) {
            expect(actualDistance).toBeLessThanOrEqual(maxDist);
          } else {
            expect(actualDistance).toBeGreaterThan(maxDist);
          }
        });

        collected.forEach(node => {
          expect(distances[node]).toBeLessThanOrEqual(maxDist);
        });
      });

      test("maxDistance=0 returns only target", async () => {
        const { target } = params;
        const { downEdges, nonResilEdges } = await loadEdges(params);

        const upEdges = downEdges.map(([a, b]) => [b, a]);
        const upNonResil = nonResilEdges.map(([a, b]) => [b, a]);

        const collected = collectNodes(target, [...upEdges, ...upNonResil], 0);
        
        expect(collected.size).toBe(1);
        expect(collected.has(target)).toBe(true);
      });

      test("maxDistance=Infinity returns all nodes", async () => {
        const { target } = params;
        const { downEdges, nonResilEdges } = await loadEdges(params);

        const upEdges = downEdges.map(([a, b]) => [b, a]);
        const upNonResil = nonResilEdges.map(([a, b]) => [b, a]);
        const allUpEdges = [...upEdges, ...upNonResil];

        const withLimit = collectNodes(target, allUpEdges, Infinity);
        const withoutLimit = collectNodes(target, allUpEdges);
        
        expect([...withLimit].sort()).toEqual([...withoutLimit].sort());
      });
    }
  );
});