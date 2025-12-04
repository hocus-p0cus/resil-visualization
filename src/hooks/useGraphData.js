import { useState, useEffect } from "react";

export function useGraphData(region, season, keyLevel) {
  const [timestamps, setTimestamps] = useState(null);
  const [downEdges, setDownEdges] = useState(null);
  const [nonResilEdges, setNonResilEdges] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!region || !season || !keyLevel) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const prefix = `${season}-${region}-resi${keyLevel}`;
      const base = `/data/${region}/${season}`;

      try {
        const [tsRes, downRes, nonResRes] = await Promise.all([
          fetch(`${base}/${prefix}_timestamps.json`),
          fetch(`${base}/${prefix}_down_edges.json`),
          fetch(`${base}/${prefix}_non_resil_edges.json`)
        ]);

        if (!tsRes.ok || !downRes.ok || !nonResRes.ok) {
          throw new Error("Failed loading graph data");
        }

        const [tsData, downData, nonResData] = await Promise.all([
          tsRes.json(),
          downRes.json(),
          nonResRes.json()
        ]);

        if (cancelled) return;

        setTimestamps(
          Object.fromEntries(
            Object.entries(tsData).map(([k, v]) => [k.toLowerCase(), v])
          )
        );

        setDownEdges(
          downData.map(e => ({
            source: e.source.toLowerCase(),
            target: e.target.toLowerCase(),
            labels: e.labels
          }))
        );

        setNonResilEdges(
          nonResData.map(e => ({
            source: e.source.toLowerCase(),
            target: e.target.toLowerCase(),
            labels: e.labels
          }))
        );

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

  return {
    timestamps,
    downEdges,
    nonResilEdges,
    loading,
    error
  };
}