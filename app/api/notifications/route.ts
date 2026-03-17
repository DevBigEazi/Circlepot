import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * Fetch notification history for a user.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userAddress = searchParams.get("userAddress");

    if (!userAddress) {
      return NextResponse.json({ error: "userAddress is required" }, { status: 400 });
    }

    const db = await getDb();
    const notificationCol = db.collection("notifications");
    
    // Fetch last 50 notifications for the user
    const notifications = await notificationCol
      .find({ userAddress: userAddress.toLowerCase() })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({ success: true, notifications });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("[NotificationsAPI] Error:", errorMsg);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

/**
 * Mark a specific notification or all notifications as read.
 */
export async function PUT(req: NextRequest) {
  try {
    const { userAddress, notificationId, all } = await req.json();

    if (!userAddress) {
      return NextResponse.json({ error: "userAddress is required" }, { status: 400 });
    }

    const db = await getDb();
    const notificationCol = db.collection("notifications");

    if (all) {
      // Mark ALL as read
      await notificationCol.updateMany(
        { userAddress: userAddress.toLowerCase(), read: false },
        { $set: { read: true } }
      );
    } else if (notificationId) {
      // Mark SPECIFIC one as read
      await notificationCol.updateOne(
        { _id: new ObjectId(notificationId as string), userAddress: userAddress.toLowerCase() },
        { $set: { read: true } }
      );
    }

    return NextResponse.json({ success: true, message: "Marked as read" });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("[NotificationsAPI] Update Error:", errorMsg);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}
