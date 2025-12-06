export function safeConfigState(prev, availableConfigs, patch) {

  const { region, season, keyLevel } = patch;

  let newRegion = region ?? prev.region;
  let newSeason = season ?? prev.season;
  let newKeyLevel = keyLevel ?? prev.keyLevel;

  const validRegions = availableConfigs.regions;
  if (!validRegions.includes(newRegion)) {
    // fallback if invalid or undefined
    newRegion = validRegions[0] ?? null;
  }

  // Fix season if invalid for this region
  const availableSeasons = availableConfigs.seasons[newRegion] ?? [];
  if (!availableSeasons.includes(newSeason)) {
    // fallback order:
    // a) previous season if valid
    // b) otherwise first available
    newSeason = availableSeasons.includes(prev.season)
    ? prev.season
      : availableSeasons[0] ?? null;
  }

  // Fix keyLevel if invalid for region+season
  const key = `${newRegion}-${newSeason}`;
  const availableLevels = availableConfigs.keyLevels[key] ?? [];
  if (!availableLevels.includes(newKeyLevel)) {
    // fallback:
    // a) previous valid key level
    // b) otherwise first available key level
    newKeyLevel = availableLevels.includes(prev.keyLevel)
      ? prev.keyLevel
      : availableLevels[0] ?? null;
  }

  return {
    region: newRegion,
    season: newSeason,
    keyLevel: newKeyLevel
  };
}