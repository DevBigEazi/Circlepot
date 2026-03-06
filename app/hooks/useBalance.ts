"use client";

import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { publicClient } from "@/lib/viem";
import { TOKEN_ABI } from "../constants/abis";
import { useAccountAddress } from "./useAccountAddress";

const TOKEN_ADDRESS = "0xe033DDef5ef67Cbc7CeC24fe5C58eC06E9BfFD67"; // USDT on Fuji

export const useBalance = () => {
  const { address, isInitializing } = useAccountAddress();

  const {
    data: balance,
    isLoading: isBalanceLoading,
    refetch,
  } = useQuery({
    queryKey: ["balance", address],
    queryFn: async () => {
      if (!address || !TOKEN_ADDRESS) return BigInt(0);

      const data = await publicClient.readContract({
        address: TOKEN_ADDRESS,
        abi: TOKEN_ABI,
        functionName: "balanceOf",
        args: [address as `0x${string}`],
      });

      return data as bigint;
    },
    enabled: !!address && !!TOKEN_ADDRESS && !isInitializing,
    refetchInterval: 30000,
  });

  return {
    balance: balance ?? BigInt(0),
    isLoading: isBalanceLoading || isInitializing,
    refetch,
    formattedBalance: balance ? formatUnits(balance, 6) : "0.00",
    address,
  };
};
