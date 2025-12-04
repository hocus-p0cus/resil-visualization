import { useState, useEffect } from "react";

export function useConfig() {
  const [availableConfigs, setAvailableConfigs] = useState({
    regions: [],
    seasons: {},
    keyLevels: {}
  });
  const [defaultRegion, setDefaultRegion] = useState(null);
  const [defaultSeason, setDefaultSeason] = useState(null);
  const [defaultKeyLevel, setDefaultKeyLevel] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/data/config.json");
        if (!res.ok) throw new Error("Failed to load config.json");

        const config = await res.json();
        if (cancelled) return;

        setAvailableConfigs(config);

        // Determine defaults
        const region = config.regions[0] || null;
        const season = region && config.seasons[region]?.[0] || null;
        const key = (region && season) 
          ? config.keyLevels[`${region}-${season}`]?.[0] 
          : null;

        setDefaultRegion(region);
        setDefaultSeason(season);
        setDefaultKeyLevel(key);

      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return {
    availableConfigs,
    defaultRegion,
    defaultSeason,
    defaultKeyLevel,
    error
  };
}
