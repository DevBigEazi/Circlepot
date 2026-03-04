import { NextRequest, NextResponse } from "next/server";
import { getDb, ensureIndexes } from "@/lib/mongodb";
import {
  verifyDynamicJwt,
  getWalletFromPayload,
  getEmailFromPayload,
  getPhoneFromPayload,
} from "@/lib/dynamic-auth";
import { uploadProfilePhoto } from "@/lib/cloudinary";
import { Profile } from "@/app/types/profile";
import { getRelayerWalletClient } from "@/lib/viem";

const ACCOUNT_ID_START = 1000000000;
const ACCOUNT_ID_MAX = 9999999999;
const REFERRAL_CONTRACT_ADDRESS = process.env
  .NEXT_PUBLIC_REFERRAL_CONTRACT as `0x${string}`;

// ABI snippet for ReferralRewards.recordReferral
const REFERRAL_ABI = [
  {
    inputs: [
      { name: "newUser", type: "address" },
      { name: "referrer", type: "address" },
    ],
    name: "recordReferral",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Dynamic JWT
    const payload = await verifyDynamicJwt(req);
    const {
      username,
      firstName,
      lastName,
      profilePhoto,
      referralCode,
      walletAddress: bodyWalletAddress,
    } = (await req.body) ? await req.json() : {};

    // 1. Resolve final wallet address (JWT is source of truth, body is fallback)
    const jwtWalletAddress = getWalletFromPayload(payload);
    const walletAddress = jwtWalletAddress || bodyWalletAddress;
    const dynamicUserId = payload.sub;

    if (!username || username.length < 3) {
      return NextResponse.json(
        { error: "Username too short" },
        { status: 400 },
      );
    }
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "First and last name required" },
        { status: 400 },
      );
    }

    await ensureIndexes();
    const db = await getDb();
    const profiles = db.collection<Profile>("profiles");

    // 2. Check for collisions (Unique constraint enforcement)
    // We check all fields that must be unique
    const collisionQuery = {
      $or: [
        { dynamicUserId },
        { username: username.toLowerCase() },
        ...(walletAddress
          ? [{ walletAddress: walletAddress.toLowerCase() }]
          : []),
      ],
    };

    const existing = await profiles.findOne(collisionQuery);

    if (existing) {
      let conflictField = "Profile";
      if (existing.username === username.toLowerCase())
        conflictField = "Username";
      if (
        walletAddress &&
        existing.walletAddress === walletAddress.toLowerCase()
      )
        conflictField = "Wallet address";

      return NextResponse.json(
        { error: `${conflictField} already exists or is in use` },
        { status: 409 },
      );
    }

    // 3. Handle Photo Upload
    let photoUrl = null;
    if (profilePhoto && profilePhoto.startsWith("data:image")) {
      // Use walletAddress if available, fall back to dynamicUserId for the folder name
      photoUrl = await uploadProfilePhoto(
        profilePhoto,
        walletAddress ?? dynamicUserId,
      );
    }

    // 4. Resolve Referrer
    let referrerAddress: string | null = null;
    if (referralCode) {
      // Try resolving by username
      const referrerProfile = await profiles.findOne({
        username: referralCode.toLowerCase(),
      });
      if (referrerProfile) {
        referrerAddress = referrerProfile.walletAddress;
      } else if (referralCode.startsWith("0x") && referralCode.length === 42) {
        // Fallback to direct address if it's a valid address
        referrerAddress = referralCode.toLowerCase();
      }
    }

    // 5. Generate unique account ID
    let accountId = 0;
    let attempts = 0;
    while (attempts < 10) {
      const candidate =
        Math.floor(Math.random() * (ACCOUNT_ID_MAX - ACCOUNT_ID_START + 1)) +
        ACCOUNT_ID_START;
      const idExists = await profiles.findOne({ accountId: candidate });
      if (!idExists) {
        accountId = candidate;
        break;
      }
      attempts++;
    }

    if (accountId === 0) {
      return NextResponse.json(
        { error: "Could not generate unique account ID" },
        { status: 500 },
      );
    }

    // 6. Create Profile in MongoDB
    const newProfile: Profile = {
      dynamicUserId,
      walletAddress,
      username: username.toLowerCase(),
      firstName,
      lastName,
      profilePhoto: photoUrl,
      accountId,
      email: getEmailFromPayload(payload),
      phoneNumber: getPhoneFromPayload(payload),
      referredBy: referrerAddress,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await profiles.insertOne(newProfile);

    // 7. Record Referral On-chain (if referrer exists AND user has a wallet)
    if (referrerAddress && walletAddress && REFERRAL_CONTRACT_ADDRESS) {
      try {
        const walletClient = getRelayerWalletClient();
        await walletClient.writeContract({
          address: REFERRAL_CONTRACT_ADDRESS,
          abi: REFERRAL_ABI,
          functionName: "recordReferral",
          args: [
            walletAddress as `0x${string}`,
            referrerAddress as `0x${string}`,
          ],
        });
      } catch (err) {
        // Non-fatal for profile creation, but log it
        console.error("Failed to record referral on-chain:", err);
      }
    }

    return NextResponse.json(newProfile, { status: 201 });
  } catch (error) {
    console.error("Profile creation error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
