import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import type {
  PushSubscription,
  NotificationPreferences,
} from "@/app/types/notifications";

interface SubscribeBody {
  subscription: PushSubscription;
  userAddress: string;
  preferences?: NotificationPreferences;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SubscribeBody;
    const { subscription, userAddress, preferences } = body;

    if (!subscription || !userAddress) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const db = await getDb();

    await db.collection("profiles").updateOne(
      { walletAddress: userAddress.toLowerCase() },
      {
        $set: {
          pushSubscription: subscription,
          ...(preferences ? { notificationPreferences: preferences } : {}),
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Internal server error";
    console.error("Subscription error:", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
