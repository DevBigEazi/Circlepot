import { getRelayerWalletClient } from "@/lib/viem";
import { getDb } from "@/lib/mongodb";
import { Profile } from "@/app/types/profile";

export const REFERRAL_CONTRACT_ADDRESS = process.env
  .NEXT_PUBLIC_REFERRAL_CONTRACT as `0x${string}`;

export const REFERRAL_ABI = [
  {
    inputs: [
      { name: "newUser", type: "address" },
      { name: "referrer", type: "address" },
    ],
    name: "recordReferral",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

/**
 * Attempts to record a referral on-chain if it hasn't been recorded yet.
 */
export async function syncReferralOnChain(profile: Profile) {
  if (
    !profile.referredBy ||
    !profile.walletAddress ||
    !REFERRAL_CONTRACT_ADDRESS
  )
    return false;

  // If it's already marked as success, skip
  if (profile.onChainReferralStatus === "success") return true;

  try {
    const walletClient = getRelayerWalletClient();
    await walletClient.writeContract({
      address: REFERRAL_CONTRACT_ADDRESS,
      abi: REFERRAL_ABI,
      functionName: "recordReferral",
      args: [
        profile.walletAddress as `0x${string}`,
        profile.referredBy as `0x${string}`,
      ],
    });

    // Update DB on success
    const db = await getDb();
    await db
      .collection<Profile>("profiles")
      .updateOne(
        { dynamicUserId: profile.dynamicUserId },
        { $set: { onChainReferralStatus: "success" } },
      );

    return true;
  } catch (err) {
    console.error(`Sync referral failed for ${profile.username}:`, err);

    // Update DB to "failed" if it wasn't already (handles legacy profiles too)
    if (profile.onChainReferralStatus !== "failed") {
      const db = await getDb();
      await db
        .collection<Profile>("profiles")
        .updateOne(
          { dynamicUserId: profile.dynamicUserId },
          { $set: { onChainReferralStatus: "failed" } },
        );
    }

    return false;
  }
}
