import { useState, useEffect } from "react";

export function useSlugMapping() {
  const [slugMapping, setSlugMapping] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const base = import.meta.env.BASE_URL;
        const res = await fetch(`${base}/slug_mapping.json`);
        if (!res.ok) throw new Error("Failed to load slug_mapping.json");
        const data = await res.json();
        if (!cancelled) setSlugMapping(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { slugMapping, error };
}