"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { storageKey } from "@/lib/config";
import { isCityMarketData } from "@/lib/guards";
import type { City, CityMarketData } from "@/lib/types";

type Result = { city: City; data: CityMarketData | null; stale: boolean; error: string };

/** Loads market samples from the API, falling back to the last copy saved on this device. */
export function useMarketData(city: City, isOnline: boolean, errorText: string) {
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    let active = true;
    const cacheKey = `${storageKey}-market-${city}`;
    api.marketData(city)
      .then((response) => {
        if (!active) return;
        if (!isCityMarketData(response, city)) throw new Error("Invalid market data");
        window.localStorage.setItem(cacheKey, JSON.stringify(response));
        setResult({ city, data: response, stale: false, error: "" });
      })
      .catch(() => {
        if (!active) return;
        try {
          const cached: unknown = JSON.parse(window.localStorage.getItem(cacheKey) ?? "null");
          if (!isCityMarketData(cached, city)) throw new Error("No cache");
          setResult({ city, data: cached, stale: true, error: "" });
        } catch {
          window.localStorage.removeItem(cacheKey);
          setResult({ city, data: null, stale: false, error: errorText });
        }
      });
    return () => { active = false; };
  }, [city, isOnline, errorText]);

  // A result for a different city is treated as "still loading" for the current one.
  const current = result?.city === city ? result : null;
  return {
    data: current?.data ?? null,
    stale: current?.stale ?? false,
    loading: current === null,
    error: current?.error ?? "",
  };
}
