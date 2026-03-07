"use client";

import { useMemo } from "react";
import { useTransactions } from "./useTransactions";
import { useSavingsActivity } from "./useSavingsActivity";
import { useCircleActivity } from "./useCircleActivity";
import { Transaction } from "../types/transaction";

/**
 * Unified activity feed that merges:
 * - Send / Receive USDT transfers (from Routescan API)
 * - Personal savings events (from subgraph)
 *
 * Returns a single sorted Transaction[] ready for rendering.
 */
export const useActivityFeed = (limit?: number) => {
  const {
    transactions: transferTxs,
    isLoading: isTransfersLoading,
    refetch: refetchTransfers,
    address,
  } = useTransactions(); // fetch all, we'll slice after merging

  const {
    savingsTransactions: savingsTxs,
    isLoading: isSavingsLoading,
    refetch: refetchSavings,
  } = useSavingsActivity();

  const {
    circleTransactions: circleTxs,
    isLoading: isCircleLoading,
    refetch: refetchCircle,
  } = useCircleActivity();

  const transactions = useMemo<Transaction[]>(() => {
    const merged = [...transferTxs, ...savingsTxs, ...circleTxs];

    // Sort by timestamp descending (most recent first)
    merged.sort((a, b) => b.timestamp - a.timestamp);

    return limit ? merged.slice(0, limit) : merged;
  }, [transferTxs, savingsTxs, circleTxs, limit]);

  const refetch = () => {
    refetchTransfers();
    refetchSavings();
    refetchCircle();
  };

  return {
    transactions,
    isLoading: isTransfersLoading || isSavingsLoading || isCircleLoading,
    refetch,
    totalCount: transactions.length,
    address,
  };
};
