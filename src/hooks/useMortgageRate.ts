import { useEffect, useState } from "react";

export type MortgageRateResult = {
  rate: number | null;
  weekOf: string | null;
  loading: boolean;
};

type CachedRate = {
  rate: number;
  weekOf: string;
  timestamp: number;
};

const CACHE_KEY = "fred_mortgage_rate_v1";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export function useMortgageRate(): MortgageRateResult {
  const [rate, setRate] = useState<number | null>(null);
  const [weekOf, setWeekOf] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_FRED_API_KEY;
    if (!apiKey) return;

    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: CachedRate = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TTL) {
          setRate(parsed.rate);
          setWeekOf(parsed.weekOf);
          return;
        }
      }
    } catch {
      // ignore cache read errors
    }

    setLoading(true);

    fetch(
      `https://api.stlouisfed.org/fred/series/observations?series_id=MORTGAGE30US&api_key=${apiKey}&sort_order=desc&limit=1&file_type=json`,
    )
      .then((r) => r.json())
      .then((data) => {
        const obs = data.observations?.[0];
        if (!obs || obs.value === ".") return;
        const fetchedRate = parseFloat(obs.value);
        if (isNaN(fetchedRate)) return;
        setRate(fetchedRate);
        setWeekOf(obs.date);
        try {
          sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ rate: fetchedRate, weekOf: obs.date, timestamp: Date.now() }),
          );
        } catch {
          // ignore cache write errors
        }
      })
      .catch(() => {
        // silently fail — component falls back to defaults
      })
      .finally(() => setLoading(false));
  }, []);

  return { rate, weekOf, loading };
}
