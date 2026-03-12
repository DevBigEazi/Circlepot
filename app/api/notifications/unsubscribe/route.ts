import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

interface UnsubscribeBody {
  userAddress: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as UnsubscribeBody;
    const { userAddress } = body;

    if (!userAddress) {
      return NextResponse.json(
        { error: "No user address provided" },
        { status: 400 }
      );
    }

    const db = await getDb();

    await db.collection("profiles").updateOne(
      { walletAddress: userAddress.toLowerCase() },
      {
        $unset: { pushSubscription: "" },
        $set: { updatedAt: new Date() },
      }
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Internal server error";
    console.error("Unsubscribe error:", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
