import { createPublicClient, http, createWalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { avalancheFuji } from "viem/chains";

// ← Swap to `avalanche` when going to mainnet
const chain = avalancheFuji;

export const publicClient = createPublicClient({
  chain,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL || undefined),
});

/**
 * Server-side wallet client used by API routes to call onlyAuthorizedRelayer
 * functions on ReferralRewards.sol (e.g. recordReferral).
 * Only available server-side — RELAYER_PRIVATE_KEY is not exposed to the browser.
 */
export function getRelayerWalletClient() {
  const pk = process.env.RELAYER_PRIVATE_KEY as `0x${string}` | undefined;
  if (!pk) throw new Error("RELAYER_PRIVATE_KEY env var is not set");

  const account = privateKeyToAccount(pk);
  return createWalletClient({
    account,
    chain,
    transport: http(process.env.NEXT_PUBLIC_RPC_URL || undefined),
  });
}
