"use client";

import { useState, useEffect, useCallback } from "react";

interface CurrencyData {
  symbol: string;
  name: string;
  rate: number;
  flag?: string;
}

interface CurrencyRates {
  [key: string]: CurrencyData;
}

const INITIAL_CURRENCIES: CurrencyRates = {
  USD: {
    symbol: "$",
    name: "US Dollar",
    rate: 1,
    flag: "https://flagcdn.com/w80/us.png",
  },
  NGN: {
    symbol: "₦",
    name: "Nigerian Naira",
    rate: 1400,
    flag: "https://flagcdn.com/w80/ng.png",
  },
  EUR: {
    symbol: "€",
    name: "Euro",
    rate: 0.8,
    flag: "https://flagcdn.com/w80/eu.png",
  },
  GBP: {
    symbol: "£",
    name: "British Pound",
    rate: 0.7,
    flag: "https://flagcdn.com/w80/gb.png",
  },
  KES: {
    symbol: "KSh",
    name: "Kenyan Shilling",
    rate: 125,
    flag: "https://flagcdn.com/w80/ke.png",
  },
  GHS: {
    symbol: "₵",
    name: "Ghanaian Cedi",
    rate: 13,
    flag: "https://flagcdn.com/w80/gh.png",
  },
  JPY: {
    symbol: "¥",
    name: "Japanese Yen",
    rate: 150,
    flag: "https://flagcdn.com/w80/jp.png",
  },
  CAD: {
    symbol: "C$",
    name: "Canadian Dollar",
    rate: 1.35,
    flag: "https://flagcdn.com/w80/ca.png",
  },
  AUD: {
    symbol: "A$",
    name: "Australian Dollar",
    rate: 1.5,
    flag: "https://flagcdn.com/w80/au.png",
  },
  CHF: {
    symbol: "CHF",
    name: "Swiss Franc",
    rate: 0.9,
    flag: "https://flagcdn.com/w80/ch.png",
  },
  CNY: {
    symbol: "¥",
    name: "Chinese Yuan",
    rate: 7.2,
    flag: "https://flagcdn.com/w80/cn.png",
  },
  INR: {
    symbol: "₹",
    name: "Indian Rupee",
    rate: 83,
    flag: "https://flagcdn.com/w80/in.png",
  },
};

interface CountryResult {
  currencies?: Record<string, { symbol?: string; name: string }>;
  flags?: { png?: string; svg?: string };
}

export const useCurrencyConverter = () => {
  const [availableCurrencies, setAvailableCurrencies] =
    useState<CurrencyRates>(INITIAL_CURRENCIES);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const cachedRates = localStorage.getItem("currency_rates_cache");
    const cachedMeta = localStorage.getItem("currency_metadata_cache");

    if (cachedMeta) {
      try {
        setAvailableCurrencies(JSON.parse(cachedMeta));
      } catch {
        // Ignore error
      }
    }

    if (cachedRates) {
      try {
        const { rates, timestamp } = JSON.parse(cachedRates);
        setExchangeRates(rates);
        setLastUpdated(new Date(timestamp));
      } catch {
        // Ignore error
      }
    } else {
      const defaultRates: Record<string, number> = {};
      Object.keys(INITIAL_CURRENCIES).forEach((key) => {
        defaultRates[key] = INITIAL_CURRENCIES[key].rate;
      });
      setExchangeRates(defaultRates);
    }
  }, []);

  const fetchAllCurrencyData = useCallback(async () => {
    try {
      setIsLoading(true);
      const countriesRes = await fetch(
        "https://restcountries.com/v3.1/all?fields=currencies,flags",
      );
      const countriesData: CountryResult[] = await countriesRes.json();
      const supportedRes = await fetch(
        "https://api.coingecko.com/api/v3/simple/supported_vs_currencies",
      );
      const supportedCodes: string[] = await supportedRes.json();
      const supportedSet = new Set(supportedCodes.map((c) => c.toUpperCase()));

      const newCurrencyMap: CurrencyRates = { ...INITIAL_CURRENCIES };
      countriesData.forEach((country) => {
        if (country.currencies) {
          Object.entries(country.currencies).forEach(([code, data]) => {
            const upperCode = code.toUpperCase();
            if (supportedSet.has(upperCode) && !newCurrencyMap[upperCode]) {
              newCurrencyMap[upperCode] = {
                symbol: data.symbol || upperCode,
                name: data.name,
                flag: country.flags?.png,
                rate: 1,
              };
            }
          });
        }
      });

      setAvailableCurrencies(newCurrencyMap);
      localStorage.setItem(
        "currency_metadata_cache",
        JSON.stringify(newCurrencyMap),
      );

      const convertTo = Object.keys(newCurrencyMap)
        .map((c) => c.toLowerCase())
        .join(",");
      const ratesRes = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=${convertTo}`,
      );
      const ratesData = await ratesRes.json();

      if (ratesData["tether"]) {
        const quotes = ratesData["tether"];
        const newRates: Record<string, number> = {};
        Object.keys(newCurrencyMap).forEach((currency) => {
          const currencyKey = currency.toLowerCase();
          newRates[currency] =
            quotes[currencyKey] || INITIAL_CURRENCIES[currency]?.rate || 1;
        });

        setExchangeRates(newRates);
        localStorage.setItem(
          "currency_rates_cache",
          JSON.stringify({
            rates: newRates,
            timestamp: new Date().toISOString(),
          }),
        );
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Failed to update rates:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const cachedRates = localStorage.getItem("currency_rates_cache");
    const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 1 week

    let shouldFetch = true;
    if (cachedRates) {
      try {
        const { timestamp } = JSON.parse(cachedRates);
        if (
          new Date().getTime() - new Date(timestamp).getTime() <
          CACHE_DURATION
        ) {
          shouldFetch = false;
        }
      } catch {
        // Ignore error
      }
    }

    if (shouldFetch) fetchAllCurrencyData();
  }, [fetchAllCurrencyData]);

  const convertToLocal = useCallback(
    (USDAmount: number, targetCurrency: string): string => {
      const rate = exchangeRates[targetCurrency] || 1;
      const localValue = USDAmount * rate;
      return localValue.toLocaleString(undefined, {
        minimumFractionDigits: localValue >= 1000 ? 0 : 2,
        maximumFractionDigits: localValue >= 1000 ? 0 : 2,
      });
    },
    [exchangeRates],
  );

  return {
    availableCurrencies,
    exchangeRates,
    isLoading,
    lastUpdated,
    convertToLocal,
    refreshPrice: fetchAllCurrencyData,
  };
};
