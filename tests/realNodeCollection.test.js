import { describe, test, expect } from "vitest";
import { collectNodes } from "../src/testables";
import { loadEdges, assertNodeType } from "./helpers/dataHelpers";
import { realDataTestCases } from "./fixtures/testCases";


describe.each(realDataTestCases)("$region $season resi$keyLevel – $type: $target", (params) => {
  test("node traversal snapshot", async () => {
    const { region, season, keyLevel, type, target } = params;

    const { downEdges, nonResilEdges } = await loadEdges(params);

    assertNodeType({ type, target, downEdges, nonResilEdges });

    const upEdges = downEdges.map(([a, b]) => [b, a]);
    const upNonResil = nonResilEdges.map(([a, b]) => [b, a]);

    const upNodes = collectNodes(target, [...upEdges, ...upNonResil]);
    const downResil = collectNodes(target, downEdges);
    const downNR = collectNodes(target, [...downEdges, ...nonResilEdges]);

    expect({
      target,
      upNodes: [...upNodes].sort(),
      downNodes: {
        resilOnly: [...downResil].sort(),
        withNonResil: [...downNR].sort(),
      }
    }).toMatchSnapshot();
  });
});