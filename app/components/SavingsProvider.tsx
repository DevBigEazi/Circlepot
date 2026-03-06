"use client";

import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { request } from "graphql-request";
import { GET_USER_SAVINGS_SUMMARY } from "../graphql/savingsQueries";
import {
  PersonalGoal,
  UserCircle,
  SubgraphSavingsResponse,
  transformPersonalGoal,
} from "../types/savings";
import { useAccountAddress } from "../hooks/useAccountAddress";

const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL || "";

interface SavingsContextType {
  personalGoals: PersonalGoal[];
  circles: UserCircle[];
  isLoading: boolean;
  refetch: () => void;
  error: Error | null;
  address?: string;
}

const SavingsContext = createContext<SavingsContextType | undefined>(undefined);

export function SavingsProvider({ children }: { children: ReactNode }) {
  const { address: rawAddress, isInitializing } = useAccountAddress();
  const address = rawAddress?.toLowerCase();

  const { data, isLoading, refetch, error } = useQuery<SubgraphSavingsResponse>(
    {
      queryKey: ["userSavings", address],
      queryFn: async () => {
        if (!address || !SUBGRAPH_URL) return { user: null };
        return request<SubgraphSavingsResponse>(
          SUBGRAPH_URL,
          GET_USER_SAVINGS_SUMMARY,
          { address: address.toLowerCase() },
        );
      },
      enabled: !!address && !!SUBGRAPH_URL && !isInitializing,
      refetchInterval: 30000,
    },
  );

  const value: SavingsContextType = {
    personalGoals: (data?.user?.personalGoals || []).map(transformPersonalGoal),
    circles: data?.user?.circles || [],
    isLoading: isLoading || isInitializing,
    refetch,
    error: error as Error | null,
    address,
  };

  return (
    <SavingsContext.Provider value={value}>{children}</SavingsContext.Provider>
  );
}

export const useSavings = () => {
  const context = useContext(SavingsContext);
  if (context === undefined) {
    throw new Error("useSavings must be used within a SavingsProvider");
  }
  return context;
};
