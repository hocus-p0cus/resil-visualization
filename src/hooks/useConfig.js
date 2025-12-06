import { useState, useEffect } from "react";
import { readUrlParams } from "../readUrlParams";

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
        const base = import.meta.env.BASE_URL;
        const res = await fetch(`${base}/data/config.json`);
        if (!res.ok) throw new Error("Failed to load config.json");

        const data = await res.json();
        if (cancelled) return;

        const qp = readUrlParams();

        let region = qp.region && data.regions.includes(qp.region)
          ? qp.region
          : data.regions[0] ?? null;

        const availableSeasons = data.seasons[region] ?? [];
        let season =
          qp.season && availableSeasons.includes(qp.season)
            ? qp.season
            : availableSeasons[0] ?? null;
        
        const levels = data.keyLevels[`${region}-${season}`] ?? [];
        let keyLevel =
          qp.keyLevel && levels.includes(qp.keyLevel)
            ? qp.keyLevel
            : levels[0] ?? null;

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