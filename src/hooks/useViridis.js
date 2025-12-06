import { useState, useEffect } from "react";

export function useViridis() {
  const [viridis, setViridis] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/viridis256.json");
        if (!res.ok) throw new Error("Failed to load viridis256.json");
        const data = await res.json();
        if (!cancelled) setViridis(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { viridis, error };
}
