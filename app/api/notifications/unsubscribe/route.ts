import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

/**
 * Remove a push subscription for a user.
 * Note: Browser typically unsubscribes automatically but we clean up our database here.
 */
export async function POST(req: NextRequest) {
  try {
    const { userAddress, endpoint } = await req.json();

    if (!userAddress) {
      return NextResponse.json(
        { error: "userAddress is required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const subCol = db.collection("subscriptions");

    const filter: { userAddress: string; endpoint?: string } = { 
      userAddress: userAddress.toLowerCase() 
    };
    
    // If specific endpoint is provided, only remove that one (good for multiple devices)
    if (endpoint) {
      filter.endpoint = endpoint;
    }

    await subCol.deleteMany(filter);

    return NextResponse.json({ success: true, message: "Unsubscribed successfully" });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("[UnsubscribeAPI] Error:", errorMsg);
    return NextResponse.json(
      { error: "Failed to unsubscribe" },
      { status: 500 }
    );
  }
}
