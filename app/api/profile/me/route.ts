import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import {
  verifyDynamicJwt,
  getUserIdentifier,
  getWalletFromPayload,
} from "@/lib/dynamic-auth";
import { Profile } from "@/app/types/profile";
import { syncReferralOnChain } from "@/lib/referral-utils";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    const payload = await verifyDynamicJwt(req);
    const { field, value } = getUserIdentifier(payload);

    const db = await getDb();
    const profiles = db.collection<Profile>("profiles");
    const profile = await profiles.findOne({ [field]: value });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // IDENTITY SYNC: Ensure the database has the prioritized Smart Account address
    const jwtWallet = getWalletFromPayload(payload);
    if (jwtWallet && profile.walletAddress !== jwtWallet) {
      await profiles.updateOne(
        { _id: profile._id as ObjectId }, // Replaced 'any' with ObjectId
        { $set: { walletAddress: jwtWallet, updatedAt: new Date() } },
      );
      profile.walletAddress = jwtWallet;
    }

    // AUTO-RETRY: If the referral was never successfully recorded on-chain, try now.
    // This handles profiles created when the relayer was out of gas.
    if (profile.referredBy && profile.onChainReferralStatus !== "success") {
      const success = await syncReferralOnChain(profile);
      if (success) {
        profile.onChainReferralStatus = "success";
      }
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Get profile error:", error);
    const isTimeout = error instanceof Error && error.message.includes("ETIMEOUT");
    const message = isTimeout 
      ? "Database connection timed out. Please check your network or DNS." 
      : (error instanceof Error ? error.message : "Internal server error");
    
    return NextResponse.json({ error: message }, { status: isTimeout ? 503 : 500 });
  }
}
