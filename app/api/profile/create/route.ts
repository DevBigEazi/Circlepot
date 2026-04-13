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
import {
  syncReferralOnChain,
  REFERRAL_CONTRACT_ADDRESS,
} from "@/lib/referral-utils";

const ACCOUNT_ID_START = 1000000000;
const ACCOUNT_ID_MAX = 9999999999;

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

    // 1. Resolve final wallet address (Body is prioritized for SA support, JWT is fallback)
    const jwtWalletAddress = getWalletFromPayload(payload);
    const walletAddress = (
      bodyWalletAddress || jwtWalletAddress
    )?.toLowerCase();
    const dynamicUserId = payload.sub;

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address could not be resolved. Please try again." },
        { status: 400 },
      );
    }

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
      // Priority 1: Try resolving by random referral code
      const profileByCode = await profiles.findOne({
        referralCode: referralCode.toUpperCase(),
      });

      if (profileByCode) {
        referrerAddress = profileByCode.walletAddress;
      } else {
        // Priority 2: Fallback to username for backward compatibility
        const profileByUsername = await profiles.findOne({
          username: referralCode.toLowerCase(),
        });

        if (profileByUsername) {
          referrerAddress = profileByUsername.walletAddress;
        } else if (referralCode.startsWith("0x") && referralCode.length === 42) {
          // Priority 3: Fallback to direct address
          referrerAddress = referralCode.toLowerCase();
        }
      }
    }

    // 5. Generate unique account ID & unique referral code
    let accountId = 0;
    let finalReferralCode = "";

    // Generate Account ID
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

    // Generate Referral Code (e.g., CP-XXXXXX)
    attempts = 0;
    while (attempts < 10) {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let code = "";
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const codeExists = await profiles.findOne({ referralCode: code });
      if (!codeExists) {
        finalReferralCode = code;
        break;
      }
      attempts++;
    }

    if (accountId === 0 || !finalReferralCode) {
      return NextResponse.json(
        { error: "Could not generate unique identifiers" },
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
      referralCode: finalReferralCode,
      onChainReferralStatus:
        referrerAddress && walletAddress ? "failed" : "none",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await profiles.insertOne(newProfile);

    // 7. Record Referral On-chain (if referrer exists AND user has a wallet)
    if (referrerAddress && walletAddress && REFERRAL_CONTRACT_ADDRESS) {
      const success = await syncReferralOnChain(newProfile);
      if (success) {
        newProfile.onChainReferralStatus = "success";
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
