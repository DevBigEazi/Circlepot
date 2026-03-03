import { createRemoteJWKSet, jwtVerify } from "jose";
import { NextRequest } from "next/server";

const ENV_ID = process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID!;
// Dynamic issues tokens from app.dynamicauth.com (not app.dynamic.xyz)
const JWKS_URL = `https://app.dynamicauth.com/api/v0/sdk/${ENV_ID}/.well-known/jwks`;

// Cache the JWKS remote key set across requests
const JWKS = createRemoteJWKSet(new URL(JWKS_URL));

// Issuer = app.dynamicauth.com/<envId>, Audience = your app's origin URL
const DYNAMIC_ISSUER = `app.dynamicauth.com/${ENV_ID}`;
const APP_ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export interface DynamicJwtPayload {
  sub: string; // Dynamic user ID
  iss: string;
  iat: number;
  exp: number;
  environment_id: string;
  verified_credentials: Array<{
    address?: string;
    chain?: string;
    id: string;
    public_identifier: string;
    wallet_name?: string;
    wallet_provider?: string;
    format?: string;
  }>;
  email?: string;
  phone_number?: string;
  alias?: string;
  lists?: string[];
  missing_fields?: string[];
}

/**
 * Verify the Dynamic JWT from the Authorization header.
 * Returns the decoded payload or throws on failure.
 */
export async function verifyDynamicJwt(
  req: NextRequest,
): Promise<DynamicJwtPayload> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or malformed Authorization header");
  }

  const token = authHeader.slice(7);

  const { payload } = await jwtVerify(token, JWKS, {
    issuer: DYNAMIC_ISSUER,
    audience: APP_ORIGIN,
  });

  return payload as unknown as DynamicJwtPayload;
}

/**
 * Extract the primary EVM wallet address from a Dynamic JWT payload.
 * Returns null if no EVM wallet is connected (e.g. phone/email-only auth).
 */
export function getWalletFromPayload(
  payload: DynamicJwtPayload,
): string | null {
  const evmCred = payload.verified_credentials?.find(
    (c) => c.chain === "EVM" && c.address,
  );
  return evmCred?.address?.toLowerCase() ?? null;
}

/**
 * Get the best available identifier for a user, for MongoDB lookups.
 * Prefers wallet address; falls back to Dynamic user ID (sub).
 * Returns the value and the field name to query against.
 */
export function getUserIdentifier(payload: DynamicJwtPayload): {
  field: "walletAddress" | "dynamicUserId";
  value: string;
} {
  const wallet = getWalletFromPayload(payload);
  if (wallet) {
    return { field: "walletAddress", value: wallet };
  }
  if (!payload.sub) {
    throw new Error(
      "No wallet address or user ID found in Dynamic credentials",
    );
  }
  return { field: "dynamicUserId", value: payload.sub };
}

/**
 * Extract verified phone from Dynamic JWT payload.
 */
export function getPhoneFromPayload(payload: DynamicJwtPayload): string | null {
  const smsCred = payload.verified_credentials?.find(
    (c) => c.format === "SMS" || c.wallet_name === "sms",
  );
  return smsCred?.public_identifier ?? payload.phone_number ?? null;
}

/**
 * Extract verified email from Dynamic JWT payload.
 */
export function getEmailFromPayload(payload: DynamicJwtPayload): string | null {
  const emailCred = payload.verified_credentials?.find(
    (c) => c.format === "email" || c.wallet_name === "emailOnly",
  );
  return emailCred?.public_identifier ?? payload.email ?? null;
}
