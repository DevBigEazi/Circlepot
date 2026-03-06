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

  // Retry logic for transient network issues (e.g., fetching JWKS)
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { payload } = await jwtVerify(token, JWKS, {
        issuer: DYNAMIC_ISSUER,
        audience: APP_ORIGIN,
      });
      return payload as unknown as DynamicJwtPayload;
    } catch (err) {
      lastError = err;
      console.warn(`JWT verification attempt ${attempt + 1} failed:`, err);
      // Only retry on potential network/fetch errors
      if (
        err instanceof TypeError ||
        (err &&
          typeof err === "object" &&
          "code" in err &&
          err.code === "UND_ERR_SOCKET")
      ) {
        await new Promise((resolve) =>
          setTimeout(resolve, 500 * (attempt + 1)),
        );
        continue;
      }
      break; // Fatal error (e.g. invalid signature, expired), don't retry
    }
  }

  throw lastError;
}

/**
 * Extract the primary EVM wallet address from a Dynamic JWT payload.
 * Returns null if no EVM wallet is connected (e.g. phone/email-only auth).
 */
export function getWalletFromPayload(
  payload: DynamicJwtPayload,
): string | null {
  if (!payload.verified_credentials) return null;

  // 1. Prioritize any Smart Wallet / Account Abstraction credentials
  const smartCred = payload.verified_credentials.find(
    (c) =>
      c.chain === "EVM" &&
      c.address &&
      (c.wallet_provider === "zerodev" ||
        c.wallet_name?.toLowerCase().includes("smart") ||
        c.wallet_name?.toLowerCase().includes("kernel") ||
        c.id?.includes("smart") ||
        c.id?.includes("aa")),
  );

  if (smartCred?.address) {
    return smartCred.address.toLowerCase();
  }

  // 2. Fallback to any EVM address (likely the Signer/EOA)
  const evmCred = payload.verified_credentials.find(
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
  // Use the sub (Dynamic User ID) as the primary identifier for DB lookups
  // This is the most stable identifier across multiple linked wallets (EOA vs Smart Account)
  if (payload.sub) {
    return { field: "dynamicUserId", value: payload.sub };
  }

  const wallet = getWalletFromPayload(payload);
  if (wallet) {
    return { field: "walletAddress", value: wallet };
  }

  throw new Error("No user ID or wallet address found in Dynamic credentials");
}

/**
 * Extract verified phone from Dynamic JWT payload.
 * High priority on the top-level phone_number from Dynamic.
 */
export function getPhoneFromPayload(payload: DynamicJwtPayload): string | null {
  if (payload.phone_number) return payload.phone_number;

  const smsCred = payload.verified_credentials?.find(
    (c) => c.format === "SMS" || c.wallet_name === "sms",
  );
  return smsCred?.public_identifier ?? null;
}

/**
 * Extract verified email from Dynamic JWT payload.
 * High priority on the top-level email field from Dynamic (the primary identity).
 */
export function getEmailFromPayload(payload: DynamicJwtPayload): string | null {
  if (payload.email) return payload.email;

  const emailCred = payload.verified_credentials?.find(
    (c) => c.format === "email" || c.wallet_name === "emailOnly",
  );
  return emailCred?.public_identifier ?? null;
}
