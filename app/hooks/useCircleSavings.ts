"use client";

import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { isZeroDevConnector } from "@dynamic-labs/ethereum-aa";
import { publicClient } from "@/lib/viem";
import { CIRCLE_SAVINGS_ABI, TOKEN_ABI } from "../constants/abis";
import { parseUnits, getAddress, BaseError } from "viem";
import { useState } from "react";

const CIRCLE_SAVING_CONTRACT = process.env
  .NEXT_PUBLIC_CIRCLE_SAVING_CONTRACT as `0x${string}`;
const USDT_CONTRACT = process.env.NEXT_PUBLIC_USDT_CONTRACT as `0x${string}`;

export interface CreateCircleParams {
  title: string;
  description: string;
  contributionAmount: string; // Decimal string
  frequency: number; // 0: Daily, 1: Weekly, 2: Monthly
  maxMembers: number;
  visibility: number; // 0: Private, 1: Public
}

export const useCircleSavings = () => {
  const { primaryWallet } = useDynamicContext();
  const [isCreating, setIsCreating] = useState(false);

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
    if (err instanceof BaseError) {
      return new Error(
        `Transaction failed: ${err.shortMessage || err.message}`,
      );
    } else if (err instanceof Error) {
      return err;
    }
    return new Error("An unknown transaction error occurred");
  };

  /**
   * Calculates required collateral for a circle.
   * Principal (Amount * Members) + 1% Late Fee Buffer.
   */
  const calculateRequiredCollateral = (amount: number, members: number) => {
    const principal = amount * members;
    const lateBuffer = principal * 0.01; // 1%
    return principal + lateBuffer;
  };

  /**
   * Creates a savings circle.
   */
  const createCircle = async (params: CreateCircleParams) => {
    setIsCreating(true);
    try {
      const { walletClient, targetAddress } = await getSmartAccountClient();
      const address = targetAddress;

      const contributionWei = parseUnits(params.contributionAmount, 6);
      const members = BigInt(params.maxMembers);

      // Calculate collateral (101% of total commitment)
      const totalCommitmentWei = contributionWei * members;
      const lateBufferWei = totalCommitmentWei / 100n; // 1%
      const collateralWei = totalCommitmentWei + lateBufferWei;

      // Visibility fee ($0.5 if public)
      const visibilityFeeWei =
        params.visibility === 1 ? parseUnits("0.5", 6) : 0n;
      const totalRequiredWei = collateralWei + visibilityFeeWei;

      // 1. Check Balance
      const balance = (await publicClient.readContract({
        address: USDT_CONTRACT,
        abi: TOKEN_ABI,
        functionName: "balanceOf",
        args: [address],
      })) as bigint;

      if (balance < totalRequiredWei) {
        throw new Error(
          `Insufficient USDT. balance: ${(Number(balance) / 1e6).toFixed(2)}, need: ${(Number(totalRequiredWei) / 1e6).toFixed(2)}`,
        );
      }

      // 2. Check & Approve Allowance
      const allowance = (await publicClient.readContract({
        address: USDT_CONTRACT,
        abi: TOKEN_ABI,
        functionName: "allowance",
        args: [address, CIRCLE_SAVING_CONTRACT],
      })) as bigint;

      if (allowance < totalRequiredWei) {
        // Approve slightly more to be safe
        const approveAmount = totalRequiredWei * 2n;

        const approveHash = await walletClient.writeContract({
          account: walletClient.account,
          address: USDT_CONTRACT,
          abi: TOKEN_ABI,
          functionName: "approve",
          args: [CIRCLE_SAVING_CONTRACT, approveAmount],
        });

        await publicClient.waitForTransactionReceipt({
          hash: approveHash,
          timeout: 120_000,
          pollingInterval: 1_000,
        });
      }

      // 3. Create Circle
      const createCircleArgs = [
        {
          title: params.title,
          description: params.description || "",
          contributionAmount: contributionWei,
          frequency: params.frequency,
          maxMembers: members,
          visibility: params.visibility,
          token: USDT_CONTRACT,
        },
      ] as const;

      const hash = await walletClient.writeContract({
        account: walletClient.account,
        address: CIRCLE_SAVING_CONTRACT,
        abi: CIRCLE_SAVINGS_ABI,
        functionName: "createCircle",
        args: createCircleArgs,
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

  return {
    createCircle,
    calculateRequiredCollateral,
    isCreating,
  };
};
