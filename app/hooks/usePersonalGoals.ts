"use client";

import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { isZeroDevConnector } from "@dynamic-labs/ethereum-aa";
import { publicClient } from "@/lib/viem";
import { PERSONAL_SAVINGS_ABI, TOKEN_ABI } from "../constants/abis";
import { parseUnits, getAddress, BaseError } from "viem";
import { useState } from "react";
import { toast } from "sonner";

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
   * Uses the Smart Account provided by Dynamic + ZeroDev for gasless transactions.
   */
  const createPersonalGoal = async (params: CreateGoalParams) => {
    if (!primaryWallet) throw new Error("Wallet not connected");

    setIsCreating(true);
    try {
      const { connector } = primaryWallet;

      console.log("--- AA INITIALIZATION ---");
      console.log("Primary Connector:", connector?.name);

      // 1. Ensure the kernel client is ready (per doc: wait for network)
      await connector.getNetwork();

      let executionClient: {
        writeContract: (args: unknown) => Promise<`0x${string}`>;
        account?: { address: string };
      };
      let targetAddress: `0x${string}`;

      if (isZeroDevConnector(connector)) {
        console.log("✅ ZeroDev Connector found. Getting AA Provider...");
        // 2. Get the Account Abstraction Provider with sponsorship enabled
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
        executionClient = provider;
        targetAddress = getAddress(provider.account?.address || "");
        console.log("✅ Smart Account (SA) Address detected:", targetAddress);
      } else {
        console.warn("⚠️ Not a ZeroDev connector. Falling back to default.");
        const client = await (
          primaryWallet as unknown as {
            getWalletClient: () => Promise<{
              writeContract: (args: unknown) => Promise<`0x${string}`>;
              account?: { address: string };
            }>;
          }
        ).getWalletClient();
        executionClient = client;
        targetAddress = getAddress(primaryWallet.address);
      }

      const eoaddress = getAddress(primaryWallet.address);

      console.log("--- ARCHITECTURE DISCOVERY ---");
      console.log("Signer (EOA):", eoaddress);
      console.log("Executer (Target):", targetAddress);

      if (targetAddress.toLowerCase() === eoaddress.toLowerCase()) {
        console.warn(
          "⚠️ WARNING: Addresses are identical. Sponsorship may not work on Fuji unless configured for EIP-7702 (which is not available on Fuji yet).",
        );
      }

      const address = targetAddress;
      const walletClient = executionClient;

      console.log("--- START CREATE GOAL ---");
      console.log("Interacting with contracts from:", address);
      console.log("Personal Savings Contract:", PERSONAL_SAVING_CONTRACT);
      console.log("USDT Token Contract:", USDT_CONTRACT);
      console.log("Goal Params:", params);

      const targetWei = parseUnits(params.targetAmount, 6);
      const contributionWei = parseUnits(params.contributionAmount, 6);

      // 1. Check Balance
      const balance = (await publicClient.readContract({
        address: USDT_CONTRACT,
        abi: TOKEN_ABI,
        functionName: "balanceOf",
        args: [address],
      })) as bigint;

      console.log("USDT Balance:", balance.toString());
      if (balance < contributionWei) {
        throw new Error(
          `Insufficient USDT. balance: ${balance.toString()}, need: ${contributionWei.toString()}`,
        );
      }

      // 2. Check & Approve Allowance
      const allowance = (await publicClient.readContract({
        address: USDT_CONTRACT,
        abi: TOKEN_ABI,
        functionName: "allowance",
        args: [address, PERSONAL_SAVING_CONTRACT],
      })) as bigint;

      console.log("Current Allowance:", allowance.toString());

      // 2. Prepare Data
      const goalArgs = [
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

      // Type-safe tuple for Viem
      const createGoalArgs = goalArgs as readonly [
        {
          name: string;
          targetAmount: bigint;
          contributionAmount: bigint;
          frequency: number;
          deadline: bigint;
          enableYield: boolean;
          token: `0x${string}`;
          yieldAPY: bigint;
        },
      ];

      if (allowance < contributionWei) {
        toast.info("Approving USDT transfer...", { duration: 3000 });
        const approveAmount = contributionWei * 2n;

        console.log("SENDING APPROVE TRANSACTION...");
        const approveHash = await walletClient.writeContract({
          account: walletClient.account,
          address: USDT_CONTRACT,
          abi: TOKEN_ABI,
          functionName: "approve",
          args: [PERSONAL_SAVING_CONTRACT, approveAmount],
        });

        console.log("Approve TX Hash:", approveHash);
        try {
          await publicClient.waitForTransactionReceipt({
            hash: approveHash,
            timeout: 120_000,
            pollingInterval: 1_000,
          });
          toast.success("USDT Approved");
        } catch (waitErr) {
          console.warn(
            "Wait for approval receipt timed out or failed, checking allowance manually...",
            waitErr,
          );
          const newAllowance = (await publicClient.readContract({
            address: USDT_CONTRACT,
            abi: TOKEN_ABI,
            functionName: "allowance",
            args: [address, PERSONAL_SAVING_CONTRACT],
          })) as bigint;

          if (newAllowance >= contributionWei) {
            console.log(
              "Allowance matches requirement despite timeout. Proceeding...",
            );
            toast.success("Approval confirmed manually");
          } else {
            throw waitErr;
          }
        }
      }

      // 3. Create Goal
      toast.info("Creating your goal...", { duration: 3000 });
      console.log("SIMULATING CREATE GOAL with address:", address);

      try {
        await publicClient.simulateContract({
          address: PERSONAL_SAVING_CONTRACT,
          abi: PERSONAL_SAVINGS_ABI,
          functionName: "createPersonalGoal",
          args: createGoalArgs,
          account: address,
        });
        console.log("CREATE GOAL SIMULATION SUCCESSFUL");
      } catch (simErr) {
        console.error("CREATE GOAL SIMULATION FAILED:", simErr);
        throw new Error(
          "Local simulation failed for Create Goal. This usually means the contract would revert on-chain.",
        );
      }

      console.log("SENDING CREATE GOAL TRANSACTION...");
      const hash = await walletClient.writeContract({
        account: walletClient.account,
        address: PERSONAL_SAVING_CONTRACT,
        abi: PERSONAL_SAVINGS_ABI,
        functionName: "createPersonalGoal",
        args: createGoalArgs,
      });

      console.log("Goal TX Hash:", hash);

      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        timeout: 120_000,
        pollingInterval: 1_000,
      });
      console.log("Transaction Receipt Received. Status:", receipt.status);

      if (receipt.status === "reverted") {
        throw new Error(
          "Transaction was mined but reverted. This usually means a contract requirement failed (e.g. USDT balance or allowance mismatch).",
        );
      }

      setIsCreating(false);
      return receipt;
    } catch (err) {
      setIsCreating(false);
      console.error("=== TRANSACTION ERROR ===");

      if (err instanceof BaseError) {
        console.log(
          "Full Error Object (JSON):",
          JSON.stringify(
            err,
            (key, value) =>
              typeof value === "bigint" ? value.toString() : value,
            2,
          ),
        );
        console.error("Error Message:", err.message);
        console.error("Short Message:", err.shortMessage);

        const errorData = (err as { data?: unknown }).data;
        if (errorData) {
          console.error("Error Data Content:", errorData);
        }

        toast.error(`Transaction failed: ${err.shortMessage || err.message}`);
      } else if (err instanceof Error) {
        console.error("Standard Error:", err.message);
        toast.error(`Transaction failed: ${err.message}`);
      } else {
        console.error("Unknown Error Type:", err);
        toast.error("An unknown transaction error occurred");
      }
      throw err;
    }
  };

  return {
    createPersonalGoal,
    checkVaultAddress,
    isCreating,
  };
};
