import { expect } from "vitest";

export async function loadEdges({ region, season, keyLevel }) {
  // data/eu/tww-season2/tww-season2-eu-resi19_down_edges.json
  const base = `../../data/${region}/${season}/${season}-${region}-resi${keyLevel}`;

  try {
    const [downJson, nonResilJson] = await Promise.all([
      import(`${base}_down_edges.json`),
      import(`${base}_non_resil_edges.json`)
    ]);
    
    return {
      downEdges: downJson.default.map(e => [e.source, e.target]),
      nonResilEdges: nonResilJson.default.map(e => [e.source, e.target]),
    };
  } catch (error) {
    throw new Error(`Failed to load edges for ${region}/${season}/level ${keyLevel}: ${error.message}`);
  }
}


export function assertNodeType({ type, target, downEdges, nonResilEdges }) {
  const validTypes = ["top", "bottom", "isolated", "mid"];
  if (!validTypes.includes(type)) {
    throw new Error(`Invalid type: ${type}. Must be one of ${validTypes.join(", ")}`);
  }

  const parentsDown = downEdges.filter(([_, child]) => child === target).length;
  const parentsNon = nonResilEdges.filter(([_, child]) => child === target).length;
  const parents = parentsDown + parentsNon;

  const childrenDown = downEdges.filter(([parent]) => parent === target).length;
  const childrenNon = nonResilEdges.filter(([parent]) => parent === target).length;
  const children = childrenDown + childrenNon;

  if (type === "top") {
    expect(parents).toBe(0);
  }
  if (type === "bottom") {
    expect(children).toBe(0);
  }
  if (type === "isolated") {
    expect(parents).toBe(0);
    expect(children).toBe(0);
  }
  if (type === "mid") {
    expect(parents).toBeGreaterThan(0);
    expect(children).toBeGreaterThan(0);
  }
}