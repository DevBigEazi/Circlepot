"use client";

import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { isZeroDevConnector } from "@dynamic-labs/ethereum-aa";
import { publicClient } from "@/lib/viem";
import { CIRCLE_SAVINGS_ABI, TOKEN_ABI } from "../constants/abis";
import { CHECK_USER_STATUS } from "../graphql/savingsQueries";
import { request } from "graphql-request";
import { parseUnits, getAddress } from "viem";

import { useState, useCallback } from "react";
import { handleSmartAccountError } from "@/lib/error-handler";


const CIRCLE_SAVING_CONTRACT = process.env
  .NEXT_PUBLIC_CIRCLE_SAVING_CONTRACT as `0x${string}`;
const USDT_CONTRACT = process.env.NEXT_PUBLIC_USDT_CONTRACT as `0x${string}`;
const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL || "";

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
  const [isJoining, setIsJoining] = useState(false);
  const [isContributing, setIsContributing] = useState(false);
  const [isInitiatingVoting, setIsInitiatingVoting] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [isExecutingVote, setIsExecutingVote] = useState(false);
  const [isWithdrawingCollateral, setIsWithdrawingCollateral] = useState(false);
  const [isInvitingMembers, setIsInvitingMembers] = useState(false);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [isForfeiting, setIsForfeiting] = useState(false);

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
   * Subgraph version of status checks
   */
  const checkUserStatusSubgraph = useCallback(
    async (circleId: string, userAddress: string) => {
      if (!SUBGRAPH_URL || !circleId || !userAddress) {
        return { isMember: false, isInvited: false };
      }

      // Subgraph BigInt expects a decimal string, but we might receive a hex string (0x01)
      const normalizedCircleId = circleId.startsWith("0x")
        ? BigInt(circleId).toString()
        : circleId;

      try {
        const result = await request<{
          circleJoineds: { id: string }[];
          memberInviteds: { id: string }[];
        }>(SUBGRAPH_URL, CHECK_USER_STATUS, {
          circleId: normalizedCircleId,
          userAddress: userAddress.toLowerCase(),
        });

        return {
          isMember: result.circleJoineds.length > 0,
          isInvited: result.memberInviteds.length > 0,
        };
      } catch (err) {
        console.error("Subgraph status check failed:", err);
        // Fallback to true/false or re-throw
        return { isMember: false, isInvited: false };
      }
    },
    [],
  );

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

  /**
   * Joins a savings circle.
   * @param circleId The ID of the circle to join
   * @param collateralAmount The collateral amount in WEI (6 decimals for USDT)
   */
  const joinCircle = async (circleId: string, collateralAmount: string) => {
    setIsJoining(true);
    try {
      const { walletClient, targetAddress } = await getSmartAccountClient();
      const address = targetAddress;

      const collateralWei = BigInt(collateralAmount);

      // 1. Check Balance
      const balance = (await publicClient.readContract({
        address: USDT_CONTRACT,
        abi: TOKEN_ABI,
        functionName: "balanceOf",
        args: [address],
      })) as bigint;

      if (balance < collateralWei) {
        throw new Error(
          `Insufficient USDT. balance: ${(Number(balance) / 1e6).toFixed(2)}, need: ${(Number(collateralWei) / 1e6).toFixed(2)}`,
        );
      }

      // 2. Check & Approve Allowance
      const allowance = (await publicClient.readContract({
        address: USDT_CONTRACT,
        abi: TOKEN_ABI,
        functionName: "allowance",
        args: [address, CIRCLE_SAVING_CONTRACT],
      })) as bigint;

      if (allowance < collateralWei) {
        // Approve the specific amount
        const approveHash = await walletClient.writeContract({
          account: walletClient.account,
          address: USDT_CONTRACT,
          abi: TOKEN_ABI,
          functionName: "approve",
          args: [CIRCLE_SAVING_CONTRACT, collateralWei],
        });

        await publicClient.waitForTransactionReceipt({
          hash: approveHash,
          timeout: 120_000,
          pollingInterval: 1_000,
        });
      }

      // 3. Join Circle
      const hash = await walletClient.writeContract({
        account: walletClient.account,
        address: CIRCLE_SAVING_CONTRACT,
        abi: CIRCLE_SAVINGS_ABI,
        functionName: "joinCircle",
        args: [BigInt(circleId)],
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
      setIsJoining(false);
    }
  };

  /**
   * Contributes to the current round of a circle.
   */
  const contribute = async (circleId: string, contributionAmount: string) => {
    setIsContributing(true);
    try {
      const { walletClient, targetAddress } = await getSmartAccountClient();
      const address = targetAddress;

      const amountWei = BigInt(contributionAmount);

      // 1. Check Balance
      const balance = (await publicClient.readContract({
        address: USDT_CONTRACT,
        abi: TOKEN_ABI,
        functionName: "balanceOf",
        args: [address],
      })) as bigint;

      if (balance < amountWei) {
        throw new Error(
          `Insufficient USDT. balance: ${(Number(balance) / 1e6).toFixed(2)}, need: ${(Number(amountWei) / 1e6).toFixed(2)}`,
        );
      }

      // 2. Check & Approve Allowance
      const allowance = (await publicClient.readContract({
        address: USDT_CONTRACT,
        abi: TOKEN_ABI,
        functionName: "allowance",
        args: [address, CIRCLE_SAVING_CONTRACT],
      })) as bigint;

      if (allowance < amountWei) {
        const approveHash = await walletClient.writeContract({
          account: walletClient.account,
          address: USDT_CONTRACT,
          abi: TOKEN_ABI,
          functionName: "approve",
          args: [CIRCLE_SAVING_CONTRACT, amountWei],
        });

        await publicClient.waitForTransactionReceipt({
          hash: approveHash,
          timeout: 120_000,
          pollingInterval: 1_000,
        });
      }

      // 3. Contribute
      const hash = await walletClient.writeContract({
        account: walletClient.account,
        address: CIRCLE_SAVING_CONTRACT,
        abi: CIRCLE_SAVINGS_ABI,
        functionName: "contribute",
        args: [BigInt(circleId)],
      });

      return await publicClient.waitForTransactionReceipt({ hash });
    } catch (err) {
      throw normalizeError(err);
    } finally {
      setIsContributing(false);
    }
  };

  /**
   * Initiates voting for a circle.
   */
  const initiateVoting = async (circleId: string) => {
    setIsInitiatingVoting(true);
    try {
      const { walletClient } = await getSmartAccountClient();

      const hash = await walletClient.writeContract({
        account: walletClient.account,
        address: CIRCLE_SAVING_CONTRACT,
        abi: CIRCLE_SAVINGS_ABI,
        functionName: "initiateVoting",
        args: [BigInt(circleId)],
      });

      return await publicClient.waitForTransactionReceipt({ hash });
    } catch (err) {
      throw normalizeError(err);
    } finally {
      setIsInitiatingVoting(false);
    }
  };

  /**
   * Casts a vote in a circle.
   * @param choice 0: START, 1: WITHDRAW
   */
  const castVote = async (circleId: string, choice: number) => {
    setIsVoting(true);
    try {
      const { walletClient } = await getSmartAccountClient();

      const hash = await walletClient.writeContract({
        account: walletClient.account,
        address: CIRCLE_SAVING_CONTRACT,
        abi: CIRCLE_SAVINGS_ABI,
        functionName: "castVote",
        args: [BigInt(circleId), choice],
      });

      return await publicClient.waitForTransactionReceipt({ hash });
    } catch (err) {
      throw normalizeError(err);
    } finally {
      setIsVoting(false);
    }
  };

  /**
   * Executes the result of a voting period.
   */
  const executeVote = async (circleId: string) => {
    setIsExecutingVote(true);
    try {
      const { walletClient } = await getSmartAccountClient();

      const hash = await walletClient.writeContract({
        account: walletClient.account,
        address: CIRCLE_SAVING_CONTRACT,
        abi: CIRCLE_SAVINGS_ABI,
        functionName: "executeVote",
        args: [BigInt(circleId)],
      });

      return await publicClient.waitForTransactionReceipt({ hash });
    } catch (err) {
      throw normalizeError(err);
    } finally {
      setIsExecutingVote(false);
    }
  };

  /**
   * Withdraws collateral from a DEAD circle.
   */
  const withdrawCollateral = async (circleId: string) => {
    setIsWithdrawingCollateral(true);
    try {
      const { walletClient } = await getSmartAccountClient();

      const hash = await walletClient.writeContract({
        account: walletClient.account,
        address: CIRCLE_SAVING_CONTRACT,
        abi: CIRCLE_SAVINGS_ABI,
        functionName: "WithdrawCollateral",
        args: [BigInt(circleId)],
      });

      return await publicClient.waitForTransactionReceipt({ hash });
    } catch (err) {
      throw normalizeError(err);
    } finally {
      setIsWithdrawingCollateral(false);
    }
  };

  /**
   * Invites new members to a private circle.
   */
  const inviteMembers = async (circleId: string, invitees: string[]) => {
    setIsInvitingMembers(true);
    try {
      const { walletClient } = await getSmartAccountClient();

      const hash = await walletClient.writeContract({
        account: walletClient.account,
        address: CIRCLE_SAVING_CONTRACT,
        abi: CIRCLE_SAVINGS_ABI,
        functionName: "inviteMembers",
        args: [BigInt(circleId), invitees],
      });

      return await publicClient.waitForTransactionReceipt({ hash });
    } catch (err) {
      throw normalizeError(err);
    } finally {
      setIsInvitingMembers(false);
    }
  };

  /**
   * Updates the visibility of a circle (0 = Private, 1 = Public).
   * Note: Changing circle visibility requires payment of a visibility fee (0.5 USDT).
   */
  const updateCircleVisibility = async (
    circleId: string,
    visibility: 0 | 1,
  ) => {
    setIsUpdatingVisibility(true);
    try {
      const { walletClient, targetAddress } = await getSmartAccountClient();
      const address = targetAddress;

      const feeWei = parseUnits("0.5", 6);

      // 1. Check Balance
      const balance = (await publicClient.readContract({
        address: USDT_CONTRACT,
        abi: TOKEN_ABI,
        functionName: "balanceOf",
        args: [address],
      })) as bigint;

      if (balance < feeWei) {
        throw new Error(
          `Insufficient USDT for visibility fee. balance: ${(Number(balance) / 1e6).toFixed(2)}, need: 0.50`,
        );
      }

      // 2. Check & Approve Allowance
      const allowance = (await publicClient.readContract({
        address: USDT_CONTRACT,
        abi: TOKEN_ABI,
        functionName: "allowance",
        args: [address, CIRCLE_SAVING_CONTRACT],
      })) as bigint;

      if (allowance < feeWei) {
        const approveHash = await walletClient.writeContract({
          account: walletClient.account,
          address: USDT_CONTRACT,
          abi: TOKEN_ABI,
          functionName: "approve",
          args: [CIRCLE_SAVING_CONTRACT, feeWei * 10n], // Approve more to be safe for future updates
        });

        await publicClient.waitForTransactionReceipt({
          hash: approveHash,
          timeout: 120_000,
          pollingInterval: 1_000,
        });
      }

      // 3. Update Visibility
      const hash = await walletClient.writeContract({
        account: walletClient.account,
        address: CIRCLE_SAVING_CONTRACT,
        abi: CIRCLE_SAVINGS_ABI,
        functionName: "updateCircleVisibility",
        args: [BigInt(circleId), visibility],
      });

      return await publicClient.waitForTransactionReceipt({ hash });
    } catch (err) {
      throw normalizeError(err);
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  /**
   * Forfeits members who missed their contribution deadline.
   */
  const forfeitMember = async (circleId: string, lateMembers: string[]) => {
    setIsForfeiting(true);
    try {
      const { walletClient } = await getSmartAccountClient();

      const hash = await walletClient.writeContract({
        account: walletClient.account,
        address: CIRCLE_SAVING_CONTRACT,
        abi: CIRCLE_SAVINGS_ABI,
        functionName: "forfeitMember",
        args: [BigInt(circleId), lateMembers],
      });

      return await publicClient.waitForTransactionReceipt({ hash });
    } catch (err) {
      throw normalizeError(err);
    } finally {
      setIsForfeiting(false);
    }
  };

  return {
    createCircle,
    joinCircle,
    contribute,
    initiateVoting,
    castVote,
    executeVote,
    withdrawCollateral,
    inviteMembers,
    updateCircleVisibility,
    forfeitMember,
    checkUserStatusSubgraph,
    calculateRequiredCollateral,
    isCreating,
    isJoining,
    isContributing,
    isInitiatingVoting,
    isVoting,
    isExecutingVote,
    isWithdrawingCollateral,
    isInvitingMembers,
    isUpdatingVisibility,
    isForfeiting,
  };
};
