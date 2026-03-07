"use client";

import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { request } from "graphql-request";
import { Transaction } from "../types/transaction";
import { useAccountAddress } from "./useAccountAddress";
import { GET_USER_CIRCLE_ACTIVITY } from "../graphql/savingsQueries";

const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL || "";

interface SubgraphTransaction {
  blockTimestamp: string;
  transactionHash: string;
}

interface CircleEvent {
  id: string;
  circleId: string;
  transaction: SubgraphTransaction;
}

interface CircleJoinedEvent extends CircleEvent {
  circleState: number;
}
interface ContributionMadeEvent extends CircleEvent {
  amount: string;
  token: string;
}
interface LateContributionMadeEvent extends CircleEvent {
  amount: string;
  fee: string;
  token: string;
}
interface PayoutDistributedEvent extends CircleEvent {
  payoutAmount: string;
  token: string;
}
interface CollateralEvent extends CircleEvent {
  amount: string;
  token: string;
}
interface DeadCircleFeeEvent extends CircleEvent {
  deadFee: string;
}
interface MemberForfeitedEvent extends CircleEvent {
  deductionAmount: string;
}
interface CircleMeta {
  circleId: string;
  circleName: string;
  collateralAmount: string; // Used to know how much was locked when joined
  creator: {
    id: string;
  };
}

interface UserCircleActivityResponse {
  circleJoineds: CircleJoinedEvent[];
  contributionMades: ContributionMadeEvent[];
  lateContributionMades: LateContributionMadeEvent[];
  payoutDistributeds: PayoutDistributedEvent[];
  collateralReturneds: CollateralEvent[];
  collateralWithdrawns: CollateralEvent[];
  memberForfeiteds: MemberForfeitedEvent[];
  deadCircleFeeDeducteds: DeadCircleFeeEvent[];
  circles: CircleMeta[];
}

export const useCircleActivity = () => {
  const { address: rawAddress, isInitializing } = useAccountAddress();
  const address = rawAddress?.toLowerCase();

  const {
    data: circleTransactions = [],
    isLoading: isQueryLoading,
    refetch,
  } = useQuery({
    queryKey: ["circleActivity", address],
    queryFn: async (): Promise<Transaction[]> => {
      if (!address || !SUBGRAPH_URL) return [];

      try {
        const data = await request<UserCircleActivityResponse>(
          SUBGRAPH_URL,
          GET_USER_CIRCLE_ACTIVITY,
          { address },
        );

        // Build lookup maps for circle names, collaterals, and creators
        const circleNames = new Map<string, string>();
        const circleCollaterals = new Map<string, string>();
        const circleCreators = new Map<string, string>();

        data.circles.forEach((c) => {
          circleNames.set(c.circleId, c.circleName);
          circleCollaterals.set(c.circleId, c.collateralAmount);
          if (c.creator?.id) {
            circleCreators.set(c.circleId, c.creator.id.toLowerCase());
          }
        });

        // Fees mapping by TX Hash so we can bundle them
        const feeByHash = new Map<string, string>();
        data.deadCircleFeeDeducteds.forEach((fee) => {
          feeByHash.set(
            fee.transaction.transactionHash,
            formatUnits(BigInt(fee.deadFee), 6),
          );
        });

        const forfeitureByHash = new Map<string, string>();
        data.memberForfeiteds.forEach((fee) => {
          forfeitureByHash.set(
            fee.transaction.transactionHash,
            formatUnits(BigInt(fee.deductionAmount), 6),
          );
        });

        const transactions: Transaction[] = [];

        // 1. Circle Joined (or Created if user is the creator)
        data.circleJoineds.forEach((j) => {
          const cName = circleNames.get(j.circleId) || "Savings Circle";
          const collateral = circleCollaterals.get(j.circleId) || "0";
          const creator = circleCreators.get(j.circleId);

          const isCreator = creator === address;
          const txType = isCreator ? "circle_created" : "circle_joined";

          transactions.push({
            id: `cj-${j.id}`,
            type: txType,
            amount: formatUnits(BigInt(collateral), 6),
            currency: "USDT",
            timestamp: parseInt(j.transaction.blockTimestamp, 10),
            status: "success",
            hash: j.transaction.transactionHash,
            from: address,
            to: "",
            isIncoming: false,
            displayName: cName,
            metadata: {
              circleName: cName,
              note: isCreator
                ? "Circle created & deposit locked"
                : "Security deposit locked",
            },
          });
        });

        // 2. Contributions
        data.contributionMades.forEach((c) => {
          const cName = circleNames.get(c.circleId) || "Savings Circle";
          transactions.push({
            id: `cc-${c.id}`,
            type: "circle_contribution",
            amount: formatUnits(BigInt(c.amount), 6),
            currency: "USDT",
            timestamp: parseInt(c.transaction.blockTimestamp, 10),
            status: "success",
            hash: c.transaction.transactionHash,
            from: address,
            to: "",
            isIncoming: false,
            displayName: cName,
            metadata: {
              circleName: cName,
              note: "Regular contribution",
            },
          });
        });

        // 3. Late Contributions (bundle fee into note)
        data.lateContributionMades.forEach((lc) => {
          const cName = circleNames.get(lc.circleId) || "Savings Circle";
          const feeStr = formatUnits(BigInt(lc.fee), 6);
          const totalBase = BigInt(lc.amount) + BigInt(lc.fee);
          const totalAmount = formatUnits(totalBase, 6);

          transactions.push({
            id: `clc-${lc.id}`,
            type: "circle_contribution",
            amount: totalAmount,
            currency: "USDT",
            timestamp: parseInt(lc.transaction.blockTimestamp, 10),
            status: "success",
            hash: lc.transaction.transactionHash,
            from: address,
            to: "",
            isIncoming: false,
            displayName: cName,
            metadata: {
              circleName: cName,
              note: `Includes late fee: $${feeStr}`,
            },
          });
        });

        // 4. Payouts
        data.payoutDistributeds.forEach((p) => {
          const cName = circleNames.get(p.circleId) || "Savings Circle";
          transactions.push({
            id: `cp-${p.id}`,
            type: "circle_payout",
            amount: formatUnits(BigInt(p.payoutAmount), 6),
            currency: "USDT",
            timestamp: parseInt(p.transaction.blockTimestamp, 10),
            status: "success",
            hash: p.transaction.transactionHash,
            from: "",
            to: address,
            isIncoming: true,
            displayName: cName,
            metadata: {
              circleName: cName,
              note: "Pot payout received",
            },
          });
        });

        // 5. Collateral Returns / Withdrawals
        const processReturn = (r: CollateralEvent) => {
          const cName = circleNames.get(r.circleId) || "Savings Circle";
          const txHash = r.transaction.transactionHash;

          let note = "Security deposit returned";
          const deadFee = feeByHash.get(txHash);
          const forfeitFee = forfeitureByHash.get(txHash);

          if (deadFee) {
            note = `Returned (Dead circle fee deducted: $${deadFee})`;
          } else if (forfeitFee) {
            note = `Forfeited (Penalty deducted: $${forfeitFee})`;
          }

          transactions.push({
            id: `cr-${r.id}`,
            type: "circle_collateral_return",
            amount: formatUnits(BigInt(r.amount), 6),
            currency: "USDT",
            timestamp: parseInt(r.transaction.blockTimestamp, 10),
            status: "success",
            hash: txHash,
            from: "",
            to: address,
            isIncoming: true,
            displayName: cName,
            metadata: {
              circleName: cName,
              note,
            },
          });
        };

        data.collateralReturneds.forEach((r) => processReturn(r));
        data.collateralWithdrawns.forEach((w) => processReturn(w));

        return transactions;
      } catch (err) {
        console.error("Error fetching circle activity:", err);
        return [];
      }
    },
    enabled: !!address && !!SUBGRAPH_URL && !isInitializing,
    refetchInterval: 60000,
  });

  return {
    circleTransactions,
    isLoading: isQueryLoading || isInitializing,
    refetch,
  };
};
