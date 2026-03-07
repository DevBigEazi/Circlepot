"use client";

import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { isZeroDevConnector } from "@dynamic-labs/ethereum-aa";
import { publicClient } from "@/lib/viem";
import { TOKEN_ABI } from "../constants/abis";
import { parseUnits, getAddress, BaseError } from "viem";
import { useState, useCallback } from "react";

const USDT_CONTRACT = process.env.NEXT_PUBLIC_USDT_CONTRACT as `0x${string}`;
const PLATFORM_FEE_RECIPIENT = process.env.NEXT_PUBLIC_PLATFORM_FEE_RECIPIENT as `0x${string}`;
const WITHDRAWAL_FEE = "0.5";

export const useTransfer = () => {
  const { primaryWallet } = useDynamicContext();
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Universal helper to resolve the Smart Account Client for a transaction.
   */
  const getSmartAccountClient = useCallback(async () => {
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
            // In ZeroDev/Dynamic integration, the provider returned often has batch capabilities
            // but for simplicity we'll try to find if it supports batching via sendTransactions or similar.
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
  }, [primaryWallet]);

  /**
   * Helper to normalize transaction errors.
   */
  const normalizeError = (err: unknown): string => {
    if (err instanceof BaseError) {
      return `Transaction failed: ${err.shortMessage || err.message}`;
    } else if (err instanceof Error) {
      return err.message;
    }
    return "An unknown transaction error occurred";
  };

  /**
   * Performs a transfer (internal or external)
   */
  const transfer = useCallback(
    async (to: string, amountWei: bigint, isExternal: boolean = false) => {
      setIsTransferring(true);
      setError(null);
      try {
        const { walletClient } = await getSmartAccountClient();

        if (!isExternal) {
          // Internal Transfer: Simple transfer
          const hash = await walletClient.writeContract({
            account: walletClient.account,
            address: USDT_CONTRACT,
            abi: TOKEN_ABI,
            functionName: "transfer",
            args: [getAddress(to), amountWei],
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
        } else {
          // External Withdrawal: Fee + Transfer
          // Note: If ZeroDev batching is not explicitly exposed here, we do it sequentially.
          // For a fully atomic batch, we'd need the ERC-4337 sendUserOperation.
          // However, writeContract in sponsorships usually handles it as a single UserOp if batching is internal.

          const feeWei = parseUnits(WITHDRAWAL_FEE, 6);

          // 1. Pay Fee
          const feeHash = await walletClient.writeContract({
            account: walletClient.account,
            address: USDT_CONTRACT,
            abi: TOKEN_ABI,
            functionName: "transfer",
            args: [PLATFORM_FEE_RECIPIENT, feeWei],
          });

          await publicClient.waitForTransactionReceipt({ hash: feeHash });

          // 2. Perform Withdrawal
          const withdrawHash = await walletClient.writeContract({
            account: walletClient.account,
            address: USDT_CONTRACT,
            abi: TOKEN_ABI,
            functionName: "transfer",
            args: [getAddress(to), amountWei],
          });

          const receipt = await publicClient.waitForTransactionReceipt({
            hash: withdrawHash,
            timeout: 120_000,
            pollingInterval: 1_000,
          });

          if (receipt.status === "reverted") {
            throw new Error("Withdrawal transaction reverted.");
          }

          return receipt;
        }
      } catch (err) {
        const msg = normalizeError(err);
        setError(msg);
        throw err;
      } finally {
        setIsTransferring(false);
      }
    },
    [getSmartAccountClient],
  );

  return {
    transfer,
    isTransferring,
    error,
    withdrawalFee: WITHDRAWAL_FEE,
  };
};
