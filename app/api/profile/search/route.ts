import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Profile } from "@/app/types/profile";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.trim().toLowerCase();

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const db = await getDb();
    const profiles = db.collection<Profile>("profiles");

    // Search by username, email, or accountId
    const filter: {
      $or: (Record<string, string | number> | { walletAddress: string })[];
    } = {
      $or: [
        { username: query },
        { email: query },
        { walletAddress: query.toLowerCase() },
      ],
    };

    // If query is a number, also search by accountId
    if (/^\d+$/.test(query)) {
      filter.$or.push({ accountId: parseInt(query) });
    }

    const result = await profiles
      .find(filter)
      .collation({ locale: "en", strength: 2 })
      .limit(1)
      .toArray();

    let safeProfile = null;
    if (result.length > 0) {
      const p = result[0];
      safeProfile = {
        ...p,
        username: "",
        email: null,
        phoneNumber: null,
        accountId: 0,
      };
    }

    return NextResponse.json(safeProfile);
  } catch (error) {
    console.error("Profile search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
