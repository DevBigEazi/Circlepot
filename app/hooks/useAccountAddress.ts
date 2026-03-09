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
        // If we don't have a wallet yet, check if we're still waiting for one to populate.
        // We'll give it a moment to avoid the "null address" race condition.
        return;
      }

      try {
        const { connector } = primaryWallet;

        // 1. Check if we already have it in additionalAddresses (fast path)
        let foundSA: string | undefined;
        wallets.forEach((w) => {
          const found = w.additionalAddresses?.find(
            (a: { type: string; address: string }) =>
              a.type === "smart-wallet" || a.type === "account-abstraction",
          );
          if (found) foundSA = found.address;
        });

        if (foundSA) {
          setAddress(getAddress(foundSA));
          setIsInitializing(false);
          return;
        }

        // 2. Fallback to deep discovery if it's a ZeroDev connector
        if (isZeroDevConnector(connector)) {
          // Sync with network to ensure AA provider is ready
          await (
            connector as { getNetwork: () => Promise<unknown> }
          ).getNetwork();
          const provider = await (
            connector as unknown as {
              getAccountAbstractionProvider: (config: {
                withSponsorship: boolean;
              }) => Promise<{ account?: { address: string } }>;
            }
          ).getAccountAbstractionProvider({ withSponsorship: true });
          if (provider?.account?.address) {
            setAddress(getAddress(provider.account.address));
            setIsInitializing(false);
            return;
          }
        }

        // 3. Last fallback to primary wallet address (EOA)
        setAddress(getAddress(primaryWallet.address));
      } catch (err) {
        console.warn(
          "Failed to resolve Smart Account address, using EOA:",
          err,
        );
        setAddress(getAddress(primaryWallet.address));
      } finally {
        setIsInitializing(false);
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
