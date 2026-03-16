"use client";

import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { isZeroDevConnector } from "@dynamic-labs/ethereum-aa";
import { publicClient } from "@/lib/viem";
import { PERSONAL_SAVINGS_ABI, TOKEN_ABI } from "../constants/abis";
import { parseUnits, getAddress } from "viem";

import { useState } from "react";
import { handleSmartAccountError } from "@/lib/error-handler";


const PERSONAL_SAVING_CONTRACT = process.env
  .NEXT_PUBLIC_PERSONAL_SAVING_CONTRACT as `0x${string}`;
const USDT_CONTRACT = process.env.NEXT_PUBLIC_USDT_CONTRACT as `0x${string}`;

export interface CreateGoalParams {
  name: string;
  targetAmount: string; // Decimal string
  contributionAmount: string; // Decimal string
  frequency: number; // 0: Daily, 1: Weekly, 2: Monthly
  deadline: number; // Unix timestamp
  enableYield: boolean;
  yieldAPY: number; // In basis points (e.g. 500 = 5%)
}

export const usePersonalGoals = () => {
  const { primaryWallet } = useDynamicContext();
  const [isCreating, setIsCreating] = useState(false);
  const [isContributing, setIsContributing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  /**
   * Universal helper to resolve the Smart Account Client for a transaction.
   */
  const getSmartAccountClient = async () => {
    if (!primaryWallet) throw new Error("Wallet not connected");

    const { connector } = primaryWallet;
    await connector.getNetwork();

    if (isZeroDevConnector(connector)) {
      const provider = await (
        connector as unknown as {
          getAccountAbstractionProvider: (config: {
            withSponsorship: boolean;
          }) => Promise<{
            writeContract: (args: unknown) => Promise<`0x${string}`>;
            account: { address: string };
          }>;
        }
      ).getAccountAbstractionProvider({
        withSponsorship: true,
      });
      return {
        walletClient: provider,
        targetAddress: getAddress(provider.account?.address || ""),
      };
    } else {
      const client = await (
        primaryWallet as unknown as {
          getWalletClient: () => Promise<{
            writeContract: (args: unknown) => Promise<`0x${string}`>;
            account?: { address: string };
          }>;
        }
      ).getWalletClient();
      return {
        walletClient: client,
        targetAddress: getAddress(primaryWallet.address),
      };
    }
  };

  /**
   * Helper to normalize transaction errors.
   */
  const normalizeError = (err: unknown): Error => {
    const message = handleSmartAccountError(err);
    return new Error(message);
  };


  /**
   * Checks if the contract has a vault assigned for the given token.
   */
  const checkVaultAddress = async (token: string) => {
    try {
      const vault = await publicClient.readContract({
        address: PERSONAL_SAVING_CONTRACT,
        abi: PERSONAL_SAVINGS_ABI,
        functionName: "tokenVaults",
        args: [getAddress(token)],
      });
      return vault;
    } catch (err) {
      console.error("Error checking vault:", err);
      return "0x0000000000000000000000000000000000000000";
    }
  };

  /**
   * Creates a personal savings goal.
   */
  const createPersonalGoal = async (params: CreateGoalParams) => {
    setIsCreating(true);
    try {
      const { walletClient, targetAddress } = await getSmartAccountClient();
      const address = targetAddress;

      const targetWei = parseUnits(params.targetAmount, 6);
      const contributionWei = parseUnits(params.contributionAmount, 6);

      // 1. Check Balance
      const balance = (await publicClient.readContract({
        address: USDT_CONTRACT,
        abi: TOKEN_ABI,
        functionName: "balanceOf",
        args: [address],
      })) as bigint;

      if (balance < contributionWei) {
        throw new Error(
          `Insufficient USDT. balance: ${(Number(balance) / 1e6).toFixed(2)}, need: ${params.contributionAmount}`,
        );
      }

      // 2. Check & Approve Allowance
      const allowance = (await publicClient.readContract({
        address: USDT_CONTRACT,
        abi: TOKEN_ABI,
        functionName: "allowance",
        args: [address, PERSONAL_SAVING_CONTRACT],
      })) as bigint;

      const createGoalArgs = [
        {
          name: params.name,
          targetAmount: targetWei,
          contributionAmount: contributionWei,
          frequency: params.frequency,
          deadline: BigInt(params.deadline),
          enableYield: params.enableYield,
          token: USDT_CONTRACT,
          yieldAPY: BigInt(params.yieldAPY),
        },
      ] as const;

      if (allowance < contributionWei) {
        const approveAmount = contributionWei * 2n;

        const approveHash = await walletClient.writeContract({
          account: walletClient.account,
          address: USDT_CONTRACT,
          abi: TOKEN_ABI,
          functionName: "approve",
          args: [PERSONAL_SAVING_CONTRACT, approveAmount],
        });

        await publicClient.waitForTransactionReceipt({
          hash: approveHash,
          timeout: 120_000,
          pollingInterval: 1_000,
        });
      }

      // 3. Create Goal
      const hash = await walletClient.writeContract({
        account: walletClient.account,
        address: PERSONAL_SAVING_CONTRACT,
        abi: PERSONAL_SAVINGS_ABI,
        functionName: "createPersonalGoal",
        args: createGoalArgs,
      });

      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        timeout: 120_000,
        pollingInterval: 1_000,
      });

      if (receipt.status === "reverted") {
        throw new Error("Transaction was mined but reverted.");
      }

      return receipt;
    } catch (err) {
      throw normalizeError(err);
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Contributes to an existing personal savings goal.
   */
  const contributeToGoal = async (goalId: string, amount: string) => {
    setIsContributing(true);
    try {
      const { walletClient, targetAddress } = await getSmartAccountClient();
      const address = targetAddress;
      const contributionWei = parseUnits(amount, 6);

      // 1. Check Balance
      const balance = (await publicClient.readContract({
        address: USDT_CONTRACT,
        abi: TOKEN_ABI,
        functionName: "balanceOf",
        args: [address],
      })) as bigint;

      if (balance < contributionWei) {
        throw new Error(
          `Insufficient USDT. balance: ${(Number(balance) / 1e6).toFixed(2)}, need: ${amount}`,
        );
      }

      // 2. Check & Approve Allowance
      const allowance = (await publicClient.readContract({
        address: USDT_CONTRACT,
        abi: TOKEN_ABI,
        functionName: "allowance",
        args: [address, PERSONAL_SAVING_CONTRACT],
      })) as bigint;

      if (allowance < contributionWei) {
        const approveAmount = contributionWei * 2n;

        const approveHash = await walletClient.writeContract({
          account: walletClient.account,
          address: USDT_CONTRACT,
          abi: TOKEN_ABI,
          functionName: "approve",
          args: [PERSONAL_SAVING_CONTRACT, approveAmount],
        });

        await publicClient.waitForTransactionReceipt({
          hash: approveHash,
          timeout: 120_000,
          pollingInterval: 1_000,
        });
      }

      // 3. Contribute to Goal
      const hash = await walletClient.writeContract({
        account: walletClient.account,
        address: PERSONAL_SAVING_CONTRACT,
        abi: PERSONAL_SAVINGS_ABI,
        functionName: "contributeToGoal",
        args: [BigInt(goalId), contributionWei],
      });

      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        timeout: 120_000,
        pollingInterval: 1_000,
      });

      if (receipt.status === "reverted") {
        throw new Error("Transaction was mined but reverted.");
      }

      return receipt;
    } catch (err) {
      throw normalizeError(err);
    } finally {
      setIsContributing(false);
    }
  };

  /**
   * Withdraws from an existing personal savings goal (Early Withdrawal).
   */
  const withdrawFromGoal = async (goalId: string, amount: string) => {
    setIsWithdrawing(true);
    try {
      const { walletClient } = await getSmartAccountClient();
      const withdrawalWei = parseUnits(amount, 6);

      const hash = await walletClient.writeContract({
        account: walletClient.account,
        address: PERSONAL_SAVING_CONTRACT,
        abi: PERSONAL_SAVINGS_ABI,
        functionName: "withdrawFromGoal",
        args: [BigInt(goalId), withdrawalWei],
      });

      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        timeout: 120_000,
        pollingInterval: 1_000,
      });

      if (receipt.status === "reverted") {
        throw new Error("Transaction was mined but reverted.");
      }

      return receipt;
    } catch (err) {
      throw normalizeError(err);
    } finally {
      setIsWithdrawing(false);
    }
  };

  /**
   * Completes a goal, withdrawing everything natively.
   */
  const completeGoal = async (goalId: string) => {
    setIsWithdrawing(true);
    try {
      const { walletClient } = await getSmartAccountClient();

      const hash = await walletClient.writeContract({
        account: walletClient.account,
        address: PERSONAL_SAVING_CONTRACT,
        abi: PERSONAL_SAVINGS_ABI,
        functionName: "completeGoal",
        args: [BigInt(goalId)],
      });

      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        timeout: 120_000,
        pollingInterval: 1_000,
      });

      if (receipt.status === "reverted") {
        throw new Error("Transaction was mined but reverted.");
      }

      return receipt;
    } catch (err) {
      throw normalizeError(err);
    } finally {
      setIsWithdrawing(false);
    }
  };

  return {
    createPersonalGoal,
    contributeToGoal,
    withdrawFromGoal,
    completeGoal,
    checkVaultAddress,
    isCreating,
    isContributing,
    isWithdrawing,
  };
};
