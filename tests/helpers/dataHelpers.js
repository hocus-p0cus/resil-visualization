import { expect } from "vitest";
import fs from "fs";
import path from "path";

// Mock fetch in Vitest environment
if (process.env.VITEST) {
  global.fetch = async (input) => {
    // input may be a URL object or string
    const url = typeof input === "string" ? input : input.pathname;

    // Remove leading slash
    const relative = url.replace(/^\//, "");

    // Map to project-local file
    const filepath = path.join(process.cwd(), "public", relative);

    const text = fs.readFileSync(filepath, "utf-8");

    return {
      ok: true,
      json: async () => JSON.parse(text)
    };
  };
}

export async function loadEdges({ region, season, keyLevel }) {
  const base = `/data/${region}/${season}/${season}-${region}-resi${keyLevel}`;

  async function load(path) {
    // Make the URL absolute for jsdom + browser
    const url = new URL(path, window.location.origin);

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to load ${url}: ${res.status}`);
    }
    return res.json();
  }

  const [downJson, nonResilJson] = await Promise.all([
    load(`${base}_down_edges.json`),
    load(`${base}_non_resil_edges.json`)
  ]);

  return {
    downEdges: downJson.map(e => [
      e.source.toLowerCase(),
      e.target.toLowerCase(),
    ]),
    nonResilEdges: nonResilJson.map(e => [
      e.source.toLowerCase(),
      e.target.toLowerCase(),
    ]),
  };
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