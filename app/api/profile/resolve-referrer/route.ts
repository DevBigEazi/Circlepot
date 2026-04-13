import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Profile } from "@/app/types/profile";

/**
 * Public route to resolve an inviter's name from a referral code or username.
 * Redacts all PII, returning only the first and last name.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code")?.trim();

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const db = await getDb();
    const profiles = db.collection<Profile>("profiles");

    // Try resolving by referralCode first, then username
    const profile = await profiles.findOne({
      $or: [
        { referralCode: code.toUpperCase() },
        { username: code.toLowerCase() }
      ]
    });

    if (!profile) {
      return NextResponse.json({ error: "Inviter not found" }, { status: 404 });
    }

    // Only return the names, no PII
    return NextResponse.json({
      firstName: profile.firstName,
      lastName: profile.lastName,
    });
  } catch (error) {
    console.error("Resolve referrer error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
