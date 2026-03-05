"use client";

import { useQuery } from "@tanstack/react-query";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { publicClient } from "@/lib/viem";
import { TOKEN_ABI } from "../constants/abis";
import { formatUnits } from "viem";

const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_USDT_CONTRACT as `0x${string}`;

export const useBalance = () => {
  const { primaryWallet } = useDynamicContext();
  const address = primaryWallet?.address as `0x${string}` | undefined;

  const {
    data: balance,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["balance", address],
    queryFn: async () => {
      if (!address || !TOKEN_ADDRESS) return BigInt(0);

      const data = await publicClient.readContract({
        address: TOKEN_ADDRESS,
        abi: TOKEN_ABI,
        functionName: "balanceOf",
        args: [address],
      });

      return data as bigint;
    },
    enabled: !!address && !!TOKEN_ADDRESS,
    refetchInterval: 30000,
  });

  return {
    balance: balance ?? BigInt(0),
    isLoading,
    refetch,
    formattedBalance: balance ? formatUnits(balance, 6) : "0.00",
  };
};
