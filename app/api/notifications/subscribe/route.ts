import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { PushSubscriptionData } from "@/app/types/notifications";

/**
 * Register a new push subscription for a user.
 */
export async function POST(req: NextRequest) {
  try {
    const data: PushSubscriptionData = await req.json();

    const { subscription, userAddress, preferences } = data;

    if (!subscription || !userAddress) {
      return NextResponse.json(
        { error: "Subscription and userAddress are required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const subCol = db.collection("subscriptions");
    const prefCol = db.collection("notification_preferences");

    // Clear old same endpoint if it exists
    await subCol.deleteOne({ endpoint: subscription.endpoint });

    // Insert new subscription
    await subCol.insertOne({
      userAddress: userAddress.toLowerCase(),
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      createdAt: new Date(),
    });

    // Save/Update preferences
    if (preferences) {
      await prefCol.updateOne(
        { userAddress: userAddress.toLowerCase() },
        { 
          $set: { 
            ...preferences, 
            updatedAt: new Date() 
          } 
        },
        { upsert: true }
      );
    }

    return NextResponse.json({ success: true, message: "Subscribed successfully" });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("[SubscribeAPI] Error:", errorMsg);
    return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500 }
    );
  }
}
