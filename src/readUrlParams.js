export function readUrlParams() {
  const params = new URLSearchParams(window.location.search);

  return {
    region: params.get("region")?.toLowerCase() || null,
    season: params.get("season")?.toLowerCase() || null,
    character: params.get("character")?.toLowerCase() || null,
    realm: params.get("realm")?.toLowerCase() || null,
    keyLevel: params.get("level") ? Number(params.get("level")) : null,
    distance: params.get("distance") ? Number(params.get("distance")) : null,
  };
}