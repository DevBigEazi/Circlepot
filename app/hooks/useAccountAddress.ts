"use client";

import {
  useDynamicContext,
  useUserWallets,
} from "@dynamic-labs/sdk-react-core";
import { isZeroDevConnector } from "@dynamic-labs/ethereum-aa";
import { useState, useEffect, useMemo } from "react";
import { getAddress } from "viem";

/**
 * The definitive hook for retrieving the user's Smart Account address.
 * It handles the initialization delay and ensures we favor the sponsored address (SA)
 * over the signer address (EOA).
 */
export const useAccountAddress = () => {
  const { primaryWallet } = useDynamicContext();
  const rawWallets = useUserWallets();
  const wallets = useMemo(() => rawWallets || [], [rawWallets]);
  const [address, setAddress] = useState<`0x${string}` | undefined>(undefined);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const resolveAddress = async () => {
      if (!primaryWallet) {
        if (isInitializing) setIsInitializing(false);
        return;
      }

      try {
        // 1. Check if we already have it in additionalAddresses (fast path)
        let foundSA: string | undefined;
        wallets.forEach((w) => {
          const found = w.additionalAddresses?.find(
            (a: { type: string; address: string }) =>
              a.type === "smart-wallet" || a.type === "account-abstraction",
          );
          if (found) foundSA = found.address;
        });

        let targetAddress: `0x${string}`;

        if (foundSA) {
          targetAddress = getAddress(foundSA);
        } else if (isZeroDevConnector(primaryWallet.connector)) {
          // 2. Fallback to deep discovery if it's a ZeroDev connector
          await (
            primaryWallet.connector as { getNetwork: () => Promise<unknown> }
          ).getNetwork();
          const provider = await (
            primaryWallet.connector as unknown as {
              getAccountAbstractionProvider: (config: {
                withSponsorship: boolean;
              }) => Promise<{ account?: { address: string } }>;
            }
          ).getAccountAbstractionProvider({ withSponsorship: true });

          if (provider?.account?.address) {
            targetAddress = getAddress(provider.account.address);
          } else {
            targetAddress = getAddress(primaryWallet.address);
          }
        } else {
          // 3. Last fallback to primary wallet address (EOA)
          targetAddress = getAddress(primaryWallet.address);
        }

        // ONLY update if actually different to avoid infinite loops
        if (address !== targetAddress) {
          setAddress(targetAddress);
        }
      } catch (err) {
        console.warn("Failed to resolve address:", err);
        const fallback = getAddress(primaryWallet.address);
        if (address !== fallback) setAddress(fallback);
      } finally {
        if (isInitializing) setIsInitializing(false);
      }
    };

    resolveAddress();
  }, [primaryWallet, wallets]);

  return {
    address,
    isInitializing,
    isSmartAccount:
      address &&
      primaryWallet &&
      address.toLowerCase() !== primaryWallet.address.toLowerCase(),
  };
};
