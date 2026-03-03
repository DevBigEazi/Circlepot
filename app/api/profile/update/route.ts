import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { verifyDynamicJwt, getUserIdentifier } from "@/lib/dynamic-auth";
import { uploadProfilePhoto, deleteProfilePhoto } from "@/lib/cloudinary";
import { Profile } from "@/app/types/profile";

export async function PATCH(req: NextRequest) {
  try {
    const payload = await verifyDynamicJwt(req);
    const { field, value } = getUserIdentifier(payload);

    const { firstName, lastName, profilePhoto } = await req.json();

    const db = await getDb();
    const profiles = db.collection<Profile>("profiles");

    const existingProfile = await profiles.findOne({ [field]: value });
    if (!existingProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const updateData: Partial<Profile> = {
      updatedAt: new Date(),
    };

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;

    if (profilePhoto && profilePhoto.startsWith("data:image")) {
      // 1. Delete old photo if it exists
      if (existingProfile.profilePhoto) {
        await deleteProfilePhoto(existingProfile.profilePhoto);
      }
      // 2. Upload new photo
      updateData.profilePhoto = await uploadProfilePhoto(
        profilePhoto,
        existingProfile.walletAddress ?? value,
      );
    }

    await profiles.updateOne({ [field]: value }, { $set: updateData });

    const updated = await profiles.findOne({ [field]: value });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Profile update error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
