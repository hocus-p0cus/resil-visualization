import { useState, useEffect } from "react";

export function useGraphData(config) {
  const { region, season, keyLevel } = config;
  const [data, setData] = useState({
    timestamps: null,
    downEdges: null,
    nonResilEdges: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!region || !season || !keyLevel) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const prefix = `${season}-${region}-resi${keyLevel}`;
      const basePath = `/data/${region}/${season}`;

      try {
        const [timestampsRes, downEdgesRes, nonResilEdgesRes] = await Promise.all([
          fetch(`${basePath}/${prefix}_timestamps.json`),
          fetch(`${basePath}/${prefix}_down_edges.json`),
          fetch(`${basePath}/${prefix}_non_resil_edges.json`)
        ]);

        if (!timestampsRes.ok || !downEdgesRes.ok || !nonResilEdgesRes.ok) {
          throw new Error('Failed to load one or more data files');
        }

        const [timestampsData, downEdgesData, nonResilEdgesData] = await Promise.all([
          timestampsRes.json(),
          downEdgesRes.json(),
          nonResilEdgesRes.json()
        ]);

        if (cancelled) return;

        setData({
          timestamps: Object.fromEntries(
            Object.entries(timestampsData).map(([name, date]) => [
              name.toLowerCase(),
              date
            ])
          ),
          downEdges: downEdgesData.map(e => ({
            source: e.source.toLowerCase(),
            target: e.target.toLowerCase(),
            labels: e.labels
          })),
          nonResilEdges: nonResilEdgesData.map(e => ({
            source: e.source.toLowerCase(),
            target: e.target.toLowerCase(),
            labels: e.labels
          })),
        });
        setLoading(false);

      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [region, season, keyLevel]);

  return { ...data, loading, error };
}