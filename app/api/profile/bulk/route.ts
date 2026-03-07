import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Profile } from "@/app/types/profile";

export async function POST(req: NextRequest) {
  try {
    const { addresses } = await req.json();

    if (!Array.isArray(addresses)) {
      return NextResponse.json(
        { error: "Addresses must be an array" },
        { status: 400 },
      );
    }

    if (addresses.length === 0) {
      return NextResponse.json([]);
    }

    const db = await getDb();
    const profiles = db.collection<Profile>("profiles");

    // Case-insensitive matching for addresses
    const normalizedAddresses = addresses.map((addr) => addr.toLowerCase());

    const result = await profiles
      .find({
        walletAddress: { $in: normalizedAddresses },
      })
      .collation({ locale: "en", strength: 2 })
      .toArray();

    return NextResponse.json(result);
  } catch (error) {
    console.error("Bulk profile fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
