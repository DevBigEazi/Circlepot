import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { verifyDynamicJwt, getUserIdentifier } from "@/lib/dynamic-auth";
import { Profile } from "@/app/types/profile";
import { syncReferralOnChain } from "@/lib/referral-utils";

export async function GET(req: NextRequest) {
  try {
    const payload = await verifyDynamicJwt(req);
    const { field, value } = getUserIdentifier(payload);

    const db = await getDb();
    const profile = await db
      .collection<Profile>("profiles")
      .findOne({ [field]: value });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
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
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
