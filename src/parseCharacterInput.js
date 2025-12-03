import { regionMapping } from "./regionMapping";

export function parseProfileURL(input) {
  // input is assumed to be lowercased
  const pattern = /^(?:https?:\/\/)?raider\.io\/characters\/(eu|us)\/([^\/]+)\/([^\/?#]+)/i;
  const match = input.match(pattern);

  if (!match) return null;

  const region = regionMapping[match[1].toLowerCase()] ?? null;
  const realmSlug = decodeURIComponent(match[2]).toLowerCase();
  const name = decodeURIComponent(match[3]).toLowerCase();

  return { region, name, realmSlug };
}

/**
 * Parse "name-realm" style input.
 * This ALWAYS returns lowercase.
 */
export function parseNameRealm(input) {
  const clean = input.trim().toLowerCase();

  if (!clean.includes("-")) {
    // Not even a name-realm pair, but still acceptable.
    return { charId: clean };
  }

  const [name, ...realmParts] = clean.split("-");
  const realm = realmParts.join("-");

  return { charId: `${name}-${realm}` };
}

/**
 * Resolve realm slug using slugMapping.
 * Does not alert. Returns fallback if not found.
 */
export function resolveRealm(slug, slugMapping) {
  if (!slugMapping) return slug.replace(/-/g, " ");

  const mapped = slugMapping[slug];
  if (mapped) return mapped.toLowerCase();

  // Fallback when slug not found: "aerie-peak" → "aerie peak"
  return slug.replace(/-/g, " ");
}

/**
 * 4. Search for existing lowercase node in graph. 
 * Returns the matched ID or null.
 */
export function findNode(id, downEdges, nonResilEdges) {
  if (!downEdges || !nonResilEdges) return null;

  const all = new Set();

  downEdges.forEach(e => {
    all.add(e.source);
    all.add(e.target);
  });
  nonResilEdges.forEach(e => {
    all.add(e.source);
    all.add(e.target);
  });

  return Array.from(all).find(node => node === id) || null;
}

export function parseCharacterInput(rawInput, slugMapping, downEdges, nonResilEdges) {
  const input = rawInput.trim().toLowerCase();

  const urlInfo = parseProfileURL(input);
  if (urlInfo) {
    const realm = resolveRealm(urlInfo.realmSlug, slugMapping);
    const charId = `${urlInfo.name}-${realm}`;
    return { charId, region: urlInfo.region };
  }

  // Fallback: parse "name-realm" style input
  const { charId } = parseNameRealm(input);

  // this will be removed later
  const found = findNode(charId, downEdges, nonResilEdges);

  return {
    charId: found || charId,
    region: null,
  };
}