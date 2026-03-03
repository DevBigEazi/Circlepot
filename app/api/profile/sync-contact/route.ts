import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import {
  verifyDynamicJwt,
  getUserIdentifier,
  getEmailFromPayload,
  getPhoneFromPayload,
} from "@/lib/dynamic-auth";
import { Profile } from "@/app/types/profile";

/**
 * Syncs verified contact info from Dynamic JWT into MongoDB.
 * Called after a user links a new email or phone number using the Dynamic SDK.
 */
export async function PATCH(req: NextRequest) {
  try {
    const payload = await verifyDynamicJwt(req);
    const { field, value } = getUserIdentifier(payload);

    const email = getEmailFromPayload(payload);
    const phoneNumber = getPhoneFromPayload(payload);

    const db = await getDb();
    const profiles = db.collection<Profile>("profiles");

    await profiles.updateOne(
      { [field]: value },
      {
        $set: {
          email,
          phoneNumber,
          updatedAt: new Date(),
        },
      },
    );

    return NextResponse.json({ success: true, email, phoneNumber });
  } catch (error) {
    console.error("Sync contact error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
