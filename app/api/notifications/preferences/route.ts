import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { NotificationPreferences } from "@/app/types/notifications";

/**
 * Handle notification preferences for a user.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userAddress = searchParams.get("userAddress");

    if (!userAddress) {
      return NextResponse.json({ error: "userAddress is required" }, { status: 400 });
    }

    const db = await getDb();
    const prefCol = db.collection("notification_preferences");
    const preferences = await prefCol.findOne({ userAddress: userAddress.toLowerCase() });

    if (!preferences) {
      return NextResponse.json({ success: false, error: "Preferences not found" });
    }

    return NextResponse.json({ success: true, preferences });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userAddress, preferences }: { userAddress: string; preferences: NotificationPreferences } = await req.json();

    if (!userAddress || !preferences) {
      return NextResponse.json({ error: "userAddress and preferences are required" }, { status: 400 });
    }

    const db = await getDb();
    const prefCol = db.collection("notification_preferences");

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

    return NextResponse.json({ success: true, message: "Preferences updated" });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("[PreferencesAPI] Error:", errorMsg);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
