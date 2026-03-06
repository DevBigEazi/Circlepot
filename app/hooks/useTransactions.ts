"use client";

import { useQuery } from "@tanstack/react-query";
import { formatUnits, getAddress } from "viem";
import { Transaction } from "../types/transaction";
import { Profile } from "../types/profile";
import { useAccountAddress } from "./useAccountAddress";

const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_USDT_CONTRACT as `0x${string}`;
const REFERRAL_CONTRACT = process.env
  .NEXT_PUBLIC_REFERRAL_CONTRACT as `0x${string}`;
const PERSONAL_SAVING_CONTRACT = process.env
  .NEXT_PUBLIC_PERSONAL_SAVING_CONTRACT as `0x${string}`;
const CIRCLE_SAVING_CONTRACT = process.env
  .NEXT_PUBLIC_CIRCLE_SAVING_CONTRACT as `0x${string}`;

/**
 * Shape of a single ERC-20 transfer from the Routescan (Etherscan-compatible) API.
 */
interface RoutescanTransfer {
  from: string;
  to: string;
  hash: string;
  value: string;
  timeStamp: string;
  tokenSymbol: string;
  tokenDecimal: string;
  blockNumber: string;
}

/**
 * Hook to fetch transaction history for the current user.
 * Consolidated to use useAccountAddress for prioritized Smart Account identity.
 */
export const useTransactions = (limit?: number) => {
  const { address, isInitializing } = useAccountAddress();

  const {
    data: transactions = [],
    isLoading: isQueryLoading,
    refetch,
  } = useQuery({
    queryKey: ["transactions", address, limit],
    queryFn: async () => {
      if (!address || !TOKEN_ADDRESS) return [];

      try {
        const pageSize = limit ? Math.min(limit + 10, 100) : 100;
        const apiUrl = `https://api.routescan.io/v2/network/testnet/evm/43113/etherscan/api?module=account&action=tokentx&contractaddress=${TOKEN_ADDRESS}&address=${address}&sort=desc&page=1&offset=${pageSize}`;

        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Routescan API error");

        const data = await response.json();
        if (data.status !== "1" || !Array.isArray(data.result)) return [];

        const transfers = data.result;

        const systemContracts = [
          REFERRAL_CONTRACT?.toLowerCase(),
          PERSONAL_SAVING_CONTRACT?.toLowerCase(),
          CIRCLE_SAVING_CONTRACT?.toLowerCase(),
        ].filter(Boolean);

        const filteredTransfers = transfers.filter((tx: RoutescanTransfer) => {
          const from = tx.from?.toLowerCase();
          const to = tx.to?.toLowerCase();
          return (
            !systemContracts.includes(from) && !systemContracts.includes(to)
          );
        });

        const finalTransfers = limit
          ? filteredTransfers.slice(0, limit)
          : filteredTransfers;

        if (finalTransfers.length === 0) return [];

        const userAddr = address.toLowerCase();
        const uniqueOtherAddresses = Array.from(
          new Set(
            finalTransfers.map((tx: RoutescanTransfer) => {
              const fromAddr = tx.from?.toLowerCase();
              return fromAddr === userAddr ? tx.to : tx.from;
            }),
          ),
        ).filter((addr): addr is string => !!addr);

        const profilesMap: Record<string, Profile> = {};
        if (uniqueOtherAddresses.length > 0) {
          const res = await fetch("/api/profile/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ addresses: uniqueOtherAddresses }),
          });
          if (res.ok) {
            const profiles: Profile[] = await res.json();
            profiles.forEach((p) => {
              if (p.walletAddress) {
                profilesMap[p.walletAddress.toLowerCase()] = p;
              }
            });
          }
        }

        return finalTransfers.map((tx: RoutescanTransfer, index: number) => {
          const from = tx.from ? getAddress(tx.from) : "";
          const to = tx.to ? getAddress(tx.to) : "";
          const isIncoming = to.toLowerCase() === address.toLowerCase();
          const otherAddress = isIncoming ? from : to;
          const profile = otherAddress
            ? profilesMap[otherAddress.toLowerCase()]
            : undefined;
          const decimals = parseInt(tx.tokenDecimal || "6", 10);

          return {
            id: `${tx.hash}-${index}`,
            type: isIncoming ? "receive" : "send",
            amount: formatUnits(BigInt(tx.value || "0"), decimals),
            currency: tx.tokenSymbol || "USDT",
            timestamp: parseInt(tx.timeStamp, 10),
            status: "success",
            hash: tx.hash,
            from,
            to,
            displayName: profile
              ? `@${profile.username}`
              : otherAddress
                ? `${otherAddress.slice(0, 6)}...${otherAddress.slice(-4)}`
                : "Unknown",
            displayPhoto: profile?.profilePhoto || undefined,
            isIncoming,
          } as Transaction;
        });
      } catch (err) {
        console.error("Error fetching transactions:", err);
        return [];
      }
    },
    enabled: !!address && !!TOKEN_ADDRESS && !isInitializing,
    refetchInterval: 60000,
  });

  return {
    transactions,
    isLoading: isQueryLoading || isInitializing,
    refetch,
    totalCount: transactions.length,
    address,
  };
};
