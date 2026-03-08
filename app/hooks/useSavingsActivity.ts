"use client";

import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { request } from "graphql-request";
import { Transaction } from "../types/transaction";
import { useAccountAddress } from "./useAccountAddress";
import { GET_PERSONAL_SAVINGS_ACTIVITY } from "../graphql/savingsQueries";

const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL || "";

// ---------- Subgraph response shapes ----------

interface SubgraphTransaction {
  blockTimestamp: string;
  transactionHash: string;
}

interface GoalContributionEvent {
  id: string;
  amount: string;
  goalId: string;
  token: string;
  transaction: SubgraphTransaction;
}

interface GoalWithdrawnEvent {
  id: string;
  goalId: string;
  amount: string;
  penalty: string;
  isActive: boolean;
  token: string;
  transaction: SubgraphTransaction;
}

interface GoalCompletedEvent {
  id: string;
  goalId: string;
  transaction: SubgraphTransaction;
}

interface PersonalGoalMeta {
  id: string;
  goalId: string;
  goalName: string;
  goalAmount: string;
}

interface SavingsActivityResponse {
  goalContributions: GoalContributionEvent[];
  goalWithdrawns: GoalWithdrawnEvent[];
  goalCompleteds: GoalCompletedEvent[];
  personalGoals: PersonalGoalMeta[];
}

// ---------- Hook ----------

/**
 * Fetches personal savings activity (contributions, withdrawals, completions)
 * from the subgraph and transforms them into the unified Transaction[] shape.
 */
export const useSavingsActivity = () => {
  const { address: rawAddress, isInitializing } = useAccountAddress();
  const address = rawAddress?.toLowerCase();

  const {
    data: savingsTransactions = [],
    isLoading: isQueryLoading,
    refetch,
  } = useQuery({
    queryKey: ["savingsActivity", address],
    queryFn: async (): Promise<Transaction[]> => {
      if (!address || !SUBGRAPH_URL) return [];

      try {
        const data = await request<SavingsActivityResponse>(
          SUBGRAPH_URL,
          GET_PERSONAL_SAVINGS_ACTIVITY,
          { address },
        );

        // Build lookup maps for goal names and amounts
        const goalNames = new Map<string, string>();
        const goalAmounts = new Map<string, string>();
        (data.personalGoals || []).forEach((g) => {
          goalNames.set(g.goalId, g.goalName);
          goalAmounts.set(g.goalId, g.goalAmount);
        });

        const transactions: Transaction[] = [];
        const seenHashes = new Set<string>();

        // --- Goal Contributions ---
        (data.goalContributions || []).forEach((c) => {
          const goalName = goalNames.get(c.goalId) || "Savings Goal";
          const txHash = c.transaction.transactionHash;
          transactions.push({
            id: `gc-${c.id}`,
            type: "goal_contribution",
            amount: formatUnits(BigInt(c.amount), 6),
            currency: "USDT",
            timestamp: parseInt(c.transaction.blockTimestamp, 10),
            status: "success",
            hash: txHash,
            from: address,
            to: "",
            isIncoming: false,
            displayName: goalName,
            metadata: {
              goalName,
              note: "Savings contribution",
            },
          });
        });

        // --- Goal Withdrawals & Completions (Primary Source: goalWithdrawns) ---
        // This captures the ACTUAL amount (including yield or minus penalty)
        (data.goalWithdrawns || []).forEach((w) => {
          const goalName = goalNames.get(w.goalId) || "Savings Goal";
          const penalty = BigInt(w.penalty);
          const txHash = w.transaction.transactionHash;
          seenHashes.add(txHash);

          const totalBase = BigInt(w.amount) + penalty;
          const penaltyBps =
            totalBase > 0n ? (penalty * 10000n) / totalBase : 0n;
          const isCompletion = penaltyBps <= 15n; // 10 bps is 0.1%
          const feeOrPenaltyFormatted = formatUnits(penalty, 6);

          transactions.push({
            id: `gw-${w.id}`,
            type: isCompletion ? "goal_completion" : "goal_withdrawal",
            amount: formatUnits(BigInt(w.amount), 6),
            currency: "USDT",
            timestamp: parseInt(w.transaction.blockTimestamp, 10),
            status: "success",
            hash: txHash,
            from: "",
            to: address,
            isIncoming: true,
            displayName: goalName,
            metadata: {
              goalName,
              note: isCompletion
                ? `Completion fee: $${feeOrPenaltyFormatted}`
                : `Early withdrawal (penalty: $${feeOrPenaltyFormatted})`,
            },
          });
        });

        // --- Supplemental Goal Completions ---
        // Only add if we haven't already captured it via a goalWithdrawn event in the same TX
        (data.goalCompleteds || []).forEach((comp) => {
          const txHash = comp.transaction.transactionHash;
          if (seenHashes.has(txHash)) return;
          seenHashes.add(txHash);

          const goalName = goalNames.get(comp.goalId) || "Savings Goal";
          const rawAmount = goalAmounts.get(comp.goalId) || "0";

          transactions.push({
            id: `gcomp-${comp.id}`,
            type: "goal_completion",
            amount: formatUnits(BigInt(rawAmount), 6),
            currency: "USDT",
            timestamp: parseInt(comp.transaction.blockTimestamp, 10),
            status: "success",
            hash: txHash,
            from: "",
            to: address,
            isIncoming: true,
            displayName: goalName,
            metadata: {
              goalName,
              note: "Goal completed successfully",
            },
          });
        });

        return transactions;
      } catch (err) {
        console.error("Error fetching savings activity:", err);
        return [];
      }
    },
    enabled: !!address && !!SUBGRAPH_URL && !isInitializing,
    refetchInterval: 60000,
  });

  return {
    savingsTransactions,
    isLoading: isQueryLoading || isInitializing,
    refetch,
  };
};
