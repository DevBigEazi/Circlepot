"use client";

import { useState, useEffect, useCallback } from "react";
import { getAAVEUSDTYield } from "../utils/apy";

interface YieldAPYData {
  apy: number;
  tvl: number;
  lastUpdated: number;
  isLoading: boolean;
  error: string | null;
}

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Global cache to persist across component instances during a session
let globalAPYCache: {
  apy: number;
  tvl: number;
  timestamp: number;
} | null = null;

export const useYieldAPY = () => {
  const [data, setData] = useState<YieldAPYData>({
    apy: 5.2, // Default initial value
    tvl: 0,
    lastUpdated: 0,
    isLoading: true,
    error: null,
  });

  const fetchAPY = useCallback(async (forceRefresh = false) => {
    // Check cache first
    if (!forceRefresh && globalAPYCache) {
      const cacheAge = Date.now() - globalAPYCache.timestamp;
      if (cacheAge < CACHE_DURATION) {
        setData({
          apy: globalAPYCache.apy,
          tvl: globalAPYCache.tvl,
          lastUpdated: globalAPYCache.timestamp,
          isLoading: false,
          error: null,
        });
        return;
      }
    }

    setData((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await getAAVEUSDTYield();
      const timestamp = Date.now();

      globalAPYCache = {
        apy: result.apy,
        tvl: result.tvl,
        timestamp,
      };

      setData({
        apy: result.apy,
        tvl: result.tvl,
        lastUpdated: timestamp,
        isLoading: false,
        error: null,
      });
    } catch (e) {
      const err = e as Error;
      console.error("APY error:", err);
      setData((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to load APY data",
      }));
    }
  }, []);

  useEffect(() => {
    // Avoid synchronous state update in effect body
    const fetchData = async () => {
      await fetchAPY();
    };
    fetchData();
  }, [fetchAPY]);

  const refresh = () => fetchAPY(true);

  return {
    ...data,
    refresh,
  };
};
