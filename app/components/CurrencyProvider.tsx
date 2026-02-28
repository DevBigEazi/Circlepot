"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface CurrencyContextType {
  selectedCurrency: string;
  setSelectedCurrency: (currency: string) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined,
);

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({
  children,
}) => {
  const [selectedCurrency, setSelectedCurrencyState] = useState<string>("USD");

  useEffect(() => {
    // Load from localStorage on client mount
    const saved = localStorage.getItem("selectedCurrency");
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedCurrencyState(saved);
    }
  }, []);

  // Persist to localStorage whenever currency changes
  useEffect(() => {
    localStorage.setItem("selectedCurrency", selectedCurrency);
  }, [selectedCurrency]);

  const setSelectedCurrency = (currency: string) => {
    setSelectedCurrencyState(currency);
  };

  return (
    <CurrencyContext.Provider value={{ selectedCurrency, setSelectedCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
