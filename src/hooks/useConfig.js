import { useState, useEffect } from "react";

export function useConfig() {
  const [config, setConfig] = useState({
    availableConfigs: {
      regions: [],
      seasons: {},
      keyLevels: {}
    },
    defaults: {
      region: null,
      season: null,
      keyLevel: null,
    },
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/data/config.json");
        if (!res.ok) throw new Error("Failed to load config.json");

        const data = await res.json();
        if (cancelled) return;

        const region = data.regions[0] || null;
        const season = region && data.seasons[region]?.[0] || null;
        const keyLevel = (region && season) 
          ? data.keyLevels[`${region}-${season}`]?.[0] 
          : null;

        // Single state update
        setConfig({
          availableConfigs: data,
          defaults: { region, season, keyLevel },
          loading: false,
          error: null,
        });

      } catch (err) {
        if (!cancelled) {
          setConfig(prev => ({
            ...prev,
            loading: false,
            error: err.message,
          }));
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return config;
}