import { BaseError, decodeErrorResult } from "viem";
import { CIRCLE_SAVINGS_ABI, PERSONAL_SAVINGS_ABI, TOKEN_ABI, REFERRAL_REWARDS_ABI } from "@/app/constants/abis";

/**
 * Maps ERC-4337 EntryPoint error codes to human-readable messages.
 */
const AA_ERROR_MAP: Record<string, string> = {
  AA10: "Invalid sender: the account address is incorrect.",
  AA13: "Invalid nonce: transaction sequence mismatch. Please try again.",
  AA21: "Sponsorship failed: Invalid paymaster signature.",
  AA23: "Sponsorship failed: The platform's gas pool is temporarily low.",
  AA24: "Sponsorship rejected: The transaction does not meet sponsorship criteria.",
  AA25: "Sponsorship post-operation failed.",
  AA31: "Paymaster deposit too low to sponsor this transaction.",
  AA33: "Sponsorship failed: Deposit too low.",
  AA40: "Verification gas limit exceeded.",
  AA41: "Pre-verification gas limit exceeded.",
  AA50: "Call gas limit exceeded.",
  AA51: "Pre-verification gas is too low for this network.",
  AA60: "Invalid validation data: Your signature is invalid.",
  AA90: "Invalid aggregator.",
  AA91: "Invalid aggregator data.",
  AA92: "Aggregator rejected the transaction.",
  AA96: "Network rejected the transaction. Please check your connection.",
};

/**
 * Maps custom smart contract errors to user-friendly messages.
 */
const CONTRACT_ERROR_MAP: Record<string, string> = {
  // CircleSavings Errors
  InvalidContributionAmount: "The contribution amount is outside the allowed range ($1 - $5000).",
  InvalidMemberCount: "The number of members must be between 5 and 20.",
  AddressZeroNotAllowed: "A required address was provided as zero.",
  TitleTooShortOrLong: "The circle title must be between 1 and 32 characters.",
  InvalidCircle: "The specified circle is invalid or does not exist.",
  OnlyCreator: "Only the circle creator can perform this action.",
  CircleNotExist: "The circle does not exist or has already been finalized.",
  SameVisibility: "The circle already has this visibility setting.",
  CircleNotOpen: "This circle is full or no longer accepting new members.",
  AlreadyJoined: "You have already joined this savings circle.",
  MinMembersNotReached: "The circle hasn't reached the 60% minimum member threshold yet.",
  UltimatumNotReached: "The preparation period hasn't ended yet. Please wait.",
  UltimatumNotPassed: "The voting period cannot start because the preparation period hasn't passed.",
  NotActiveMember: "You are not an active member of this circle.",
  VotingStillActive: "Voting is still in progress. Please wait for it to end.",
  VotingAlreadyExecuted: "The vote results have already been applied.",
  InvalidVoteChoice: "Please select a valid voting option (Start or Withdraw).",
  VotingNotActive: "No active voting session was found for this circle.",
  VotingPeriodEnded: "The voting period has already concluded.",
  AlreadyVoted: "You have already cast your vote for this circle.",
  VoteAlreadyExecuted: "The vote result has already been processed.",
  CircleNotPrivate: "This action is only available for private circles.",
  NotInvited: "You have not been invited to this private circle.",
  CircleNotActive: "The circle is not currently in an active state.",
  AlreadyContributed: "You have already made your contribution for this period.",
  InsufficientCollateral: "You do not have enough collateral or balance for this action.",
  GracePeriodNotExpired: "The grace period for the late member hasn't expired yet.",
  NotNextRecipient: "It is not your turn to receive the payout yet.",
  UnsupportedToken: "This token is not supported by the platform.",
  TokenAlreadySupported: "This token is already on the allowlist.",
  TokenNotSupported: "This token is not currently supported.",

  // PersonalSavings Errors
  InvalidTreasuryAddress: "The platform treasury address is incorrectly configured.",
  InvalidGoalAmount: "The goal target must be between $10 and $50,000.",
  // InvalidInputs: "Contribution amount can't be greater than or equal to the target amount.",
  InvalidDeadline: "The goal deadline must be in the future.",
  InvalidSavingGoal: "The specified goal is invalid or was not found.",
  NotGoalOwner: "Only the owner of this goal can perform this action.",
  GoalNotActive: "This goal is no longer active.",
  InsufficientBalance: "You don't have enough balance in this goal for this withdrawal.",

  // General Errors
  OwnableUnauthorizedAccount: "You don't have permission to perform this administrative action.",
  ReentrancyGuardReentrantCall: "A security error occurred. Please refresh and try again.",

  // Reputation & Referral Errors
  ScoreOutOfBounds: "The reputation score is outside the valid range.",
  InsufficientReputation: "Your reputation score is too low for this action.",
  RewardTransferFailed: "Failed to transfer the referral reward.",
  UnauthorizedContract: "This contract is not authorized to perform the action.",
  
  // Referral Rewards Errors
  AlreadyReferred: "This user has already been referred.",
  CannotReferSelf: "You cannot refer yourself.",
  InvalidAddress: "The provided address is invalid.",
  OnlyPersonalSavings: "This action can only be performed by the Personal Savings contract.",
  OnlyRelayer: "This action is restricted to authorized relayers.",
};

/**
 * Helper to try and decode hex data using known ABIs
 */
const tryDecodeHexData = (data: `0x${string}`): string | null => {
  const abis = [
    CIRCLE_SAVINGS_ABI,
    PERSONAL_SAVINGS_ABI,
    TOKEN_ABI,
    REFERRAL_REWARDS_ABI,
  ];
  for (const abi of abis) {
    try {
      const decoded = decodeErrorResult({ abi, data });
      if (decoded?.errorName && CONTRACT_ERROR_MAP[decoded.errorName]) {
        return CONTRACT_ERROR_MAP[decoded.errorName];
      }
      if (decoded?.errorName) {
        return `Contract Error: ${decoded.errorName}`;
      }
    } catch {
      continue;
    }
  }
  return null;
};

/**
 * Normalizes any error into a user-friendly string.
 */
export const handleSmartAccountError = (err: unknown): string => {
  console.error("DEBUG: Full Error Object:", err);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const findInObject = (obj: any, depth = 0): string | null => {
    if (!obj || depth > 8) return null;

    // Direct string matching
    if (typeof obj === "string") {
      const lower = obj.toLowerCase();
      
      const hexMatch = obj.match(/0x[a-fA-F0-9]{8,}/);
      if (hexMatch) {
        const decoded = tryDecodeHexData(hexMatch[0] as `0x${string}`);
        if (decoded) return decoded;
      }

      if (lower.includes("err_internet_disconnected") || lower.includes("failed to fetch") || lower.includes("network error") || lower.includes("no internet")) {
        return "Internet connection lost. Please check your network and try again.";
      }

      if (
        lower.includes("timed out") || 
        lower.includes("timeout") || 
        lower.includes("sessionrequesttimeouterror") ||
        lower.includes("mpc") ||
        lower.includes("forward client")
      ) {
        return "The request timed out or signing failed. Please try again.";
      }

      if (lower.includes("user rejected") || lower.includes("user denied")) {
        return "Transaction cancelled by user.";
      }

      if (lower.includes("insufficient funds") || lower.includes("insufficient balance") || lower.includes("exceeds the balance")) {
        return "Insufficient balance for this transaction.";
      }
    }

    // Handle Error objects or plain objects with message/details
    if (typeof obj === "object") {
        // If it's an Error, check its message first
        if (obj instanceof Error || obj.message) {
            const res = findInObject(obj.message, depth + 1);
            if (res) return res;
        }

        // Check common nested properties
        const priorityKeys = ["error", "cause", "details", "shortMessage", "data", "body"];
        for (const key of priorityKeys) {
            if (obj[key]) {
                const res = findInObject(obj[key], depth + 1);
                if (res) return res;
            }
        }

        // Fallback: check all other properties if not one of the above
        for (const key in obj) {
            try {
                if (!priorityKeys.includes(key) && obj[key] && typeof obj[key] !== "function") {
                    const res = findInObject(obj[key], depth + 1);
                    if (res) return res;
                }
            } catch {
                continue;
            }
        }
    }

    return null;
  };

  const prioritizedMessage = findInObject(err);
  if (prioritizedMessage) return prioritizedMessage;

  // Final fallback to checking the string representation for AA codes
  const errorString = String(err);
  for (const [code, message] of Object.entries(AA_ERROR_MAP)) {
    if (errorString.includes(code)) {
      return message;
    }
  }

  if (err instanceof Error) {
    if (err instanceof BaseError) return err.shortMessage || err.message;
    return err.message;
  }

  return "An unexpected error occurred. Please try again or contact support.";
};
