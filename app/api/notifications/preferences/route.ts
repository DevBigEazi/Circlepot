import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import type { NotificationPreferences } from "@/app/types/notifications";

interface PreferencesBody {
  userAddress: string;
  preferences: NotificationPreferences;
}

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as PreferencesBody;
    const { userAddress, preferences } = body;

    if (!userAddress || !preferences) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const db = await getDb();

    await db.collection("profiles").updateOne(
      { walletAddress: userAddress.toLowerCase() },
      {
        $set: {
          notificationPreferences: preferences,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Internal server error";
    console.error("Preferences update error:", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
