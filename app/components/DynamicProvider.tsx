"use client";

import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { ZeroDevSmartWalletConnectors } from "@dynamic-labs/ethereum-aa";

export default function DynamicProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DynamicContextProvider
      settings={
        {
          environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID || "",
          walletConnectors: [
            EthereumWalletConnectors,
            ZeroDevSmartWalletConnectors,
          ],
          /* 
            Account Abstraction configuration for ZeroDev.
            This enables gasless transactions by linking your ZeroDev project.
          */
          accountAbstraction: {
            connectors: [
              {
                type: "zerodev",
                projectId: process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID || "",
                projectIds: {
                  "43113": process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID || "",
                },
                kernelVersion: "v3",
                accountType: "kernel",
                entryPointVersion: "v0.7", // Critical for Kernel v3 compatibility with Paymaster
                sponsorUserOperation: true,
              },
            ],
            defaultToSmartAccount: true,
            shouldShowSmartWalletOnly: true, // Force UI to only use Smart Wallet
            targets: ["43113"], // Apply this to Avalanche Fuji
            onTransactionRequested: (wallet: {
              address: string;
              connector?: { name?: string };
            }) => {
              console.log(
                "🚀 Transaction requested for wallet:",
                wallet.address,
              );
              console.log(
                "Is Smart Wallet:",
                wallet.connector?.name?.toLowerCase().includes("smart"),
              );
              return true;
            },
            onSimulationRequested: () => true,
          },
          embeddedWallets: {
            hideTransactionConfirmation: true,
          },
          hideEmbeddedWalletUIs: true,
          hideEmbeddedWalletTransactionUIs: true,
        } as import("@dynamic-labs/sdk-react-core").DynamicContextProps["settings"]
      }
    >
      {children}
    </DynamicContextProvider>
  );
}
