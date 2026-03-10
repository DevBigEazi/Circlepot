import {
  Circle,
  ActiveCircle,
  CirclePayout,
  VotingEvent,
  VoteCast,
  VoteResult,
} from "../types/savings";
import { formatUnits } from "viem";

/**
 * Format blockchain timestamp to readable date
 */
export const formatTimestamp = (timestamp: string | number | bigint) => {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Helper to format BigInt to readable number (default 6 decimals for USDT on Fuji)
 */
export const formatBigInt = (
  value: bigint | string | number,
  decimals: number = 6,
): string => {
  try {
    return formatUnits(BigInt(value || 0), decimals);
  } catch {
    return "0";
  }
};

/**
 * Helper to get frequency text
 */
export const getFrequencyText = (frequency: number): string => {
  switch (frequency) {
    case 0:
      return "Daily";
    case 1:
      return "Weekly";
    case 2:
      return "Monthly";
    default:
      return "Unknown";
  }
};

/**
 * Helper to get state text
 */
export const getStateText = (state: number): ActiveCircle["status"] => {
  switch (state) {
    case 0:
      return "pending";
    case 1:
      return "created";
    case 2:
      return "voting";
    case 3:
      return "active";
    case 4:
      return "completed";
    case 5:
      return "dead";
    default:
      return "unknown";
  }
};

/**
 * Calculate base deadline for the current round
 */
export const calculateBaseDeadline = (
  startedAt: string | number | bigint,
  frequency: number,
  currentRound: string | number | bigint = 1n,
  lastPayoutTimestamp?: string | number | bigint,
): bigint => {
  const startedAtNum = Number(startedAt);
  if (startedAtNum === 0) return 0n;

  let basisDate: Date;
  let roundsToAdd: number;

  if (
    BigInt(currentRound) > 1n &&
    lastPayoutTimestamp &&
    Number(lastPayoutTimestamp) > 0
  ) {
    basisDate = new Date(Number(lastPayoutTimestamp) * 1000);
    roundsToAdd = 1;
  } else {
    basisDate = new Date(startedAtNum * 1000);
    roundsToAdd = Number(currentRound);
  }

  const nextDate = new Date(basisDate);
  switch (frequency) {
    case 0:
      nextDate.setDate(nextDate.getDate() + roundsToAdd);
      break;
    case 1:
      nextDate.setDate(nextDate.getDate() + roundsToAdd * 7);
      break;
    case 2:
      nextDate.setMonth(nextDate.getMonth() + roundsToAdd);
      break;
  }

  return BigInt(Math.floor(nextDate.getTime() / 1000));
};

/**
 * Calculate contribution deadline including grace period
 */
export const calculateContributionDeadline = (
  startedAt: string | number | bigint,
  currentRound: string | number | bigint,
  frequency: number,
  lastPayoutTimestamp?: string | number | bigint,
): string => {
  const baseDeadline = calculateBaseDeadline(
    startedAt,
    frequency,
    currentRound,
    lastPayoutTimestamp,
  );
  if (baseDeadline === 0n) return "0";

  const deadlineDate = new Date(Number(baseDeadline) * 1000);
  const gracePeriodHours = frequency === 0 ? 12 : 48;
  deadlineDate.setHours(deadlineDate.getHours() + gracePeriodHours);

  return Math.floor(deadlineDate.getTime() / 1000).toString();
};

/**
 * Calculate next payout date string
 */
export const calculateNextPayout = (
  startedAt: string | number | bigint,
  frequency: number,
  currentRound: string | number | bigint = 1n,
  lastPayoutTimestamp?: string | number | bigint,
): string => {
  const deadline = calculateBaseDeadline(
    startedAt,
    frequency,
    currentRound,
    lastPayoutTimestamp,
  );
  if (deadline === 0n) return "Pending Start";

  const nextDate = new Date(Number(deadline) * 1000);
  return nextDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/**
 * Transform Circle to ActiveCircle
 */
export const transformCircleToActiveCircle = (
  circle: Circle,
  userAddress?: string,
  payouts: CirclePayout[] = [],
  votingEvents: VotingEvent[] = [],
  voteResults: VoteResult[] = [],
  votes: VoteCast[] = [],
): ActiveCircle => {
  const members = circle.members || [];
  const userMember = members.find((m) =>
    m.id.toLowerCase().includes(userAddress?.toLowerCase() || ""),
  );

  const isCreator =
    userAddress &&
    circle.creator?.id?.toLowerCase() === userAddress.toLowerCase();

  // Calculate Payout (Tiered Fee)
  const totalPot =
    BigInt(circle.contributionAmount) * BigInt(circle.maxMembers || 0);
  let payoutAmountBigInt = totalPot;
  if (!isCreator) {
    if (totalPot <= 1000000000n) {
      // <= $1000
      const platformFee = (totalPot * 100n) / 10000n; // 1%
      payoutAmountBigInt = totalPot - platformFee;
    } else {
      payoutAmountBigInt = totalPot - 10000000n; // Fixed $10 fee
    }
  }

  const userTotalContributed = userMember
    ? formatBigInt(userMember.totalContributed)
    : "0";

  const baseDeadlineBigInt = calculateBaseDeadline(
    circle.startedAt,
    circle.frequency,
    circle.currentRound,
  );

  const contributionDeadlineBigInt = BigInt(
    calculateContributionDeadline(
      circle.startedAt,
      circle.currentRound,
      circle.frequency,
    ),
  );

  const now = BigInt(Math.floor(Date.now() / 1000));

  // Collateral Calculations
  const contributionNum = parseFloat(
    formatUnits(BigInt(circle.contributionAmount), 6),
  );
  const maxMembersCount = Number(circle.maxMembers || 0);
  const currentMembersCount = Number(circle.currentMembers || 0);

  // Principal (Amount * Members) + 1% Late Fee Buffer
  // We use the same logic as the legacy project for 'Required' collateral
  const calcCollateral = (members: number) => {
    const principal = contributionNum * members;
    return (principal * 1.01).toFixed(2);
  };

  // Locked is what the user actually has in the contract
  const collateralLocked = userMember
    ? formatBigInt(userMember.collateralLocked)
    : calcCollateral(maxMembersCount); // Fallback to expected if not joined

  const collateralRequired = calcCollateral(currentMembersCount);

  // Map members plus empty slots
  const combinedMembers = [];
  for (let i = 0; i < maxMembersCount; i++) {
    const m =
      members.find((member) => Number(member.position) === i + 1) ||
      (i < currentMembersCount ? members[i] : null); // Fallback for unstarted circles

    if (m) {
      combinedMembers.push({
        id: m.user?.id || m.id,
        username:
          (m as { username?: string }).username ||
          m.user?.id?.slice(0, 8) ||
          m.id.slice(0, 8),
        fullName:
          (m as { fullName?: string }).fullName ||
          (m.user?.id?.slice(0, 12) ? m.user.id.slice(0, 12) + "..." : null) ||
          m.id.slice(0, 12) + "...",
        avatarUrl:
          (m as { avatar?: string }).avatar ||
          (m as { avatarUrl?: string }).avatarUrl ||
          null,
        position: Number(m.position) > 0 ? Number(m.position) : i + 1,
        isActive: m.isActive,
        hasContributed:
          (m as { hasContributed?: boolean }).hasContributed || false,
        hasReceivedPayout: m.hasReceivedPayout || false,
      });
    } else {
      combinedMembers.push({
        id: `empty-${i}`,
        username: "Empty Slot",
        fullName: "Empty Slot",
        position: i + 1,
        isActive: false,
        hasContributed: false,
        hasReceivedPayout: false,
      });
    }
  }

  return {
    id: circle.id,
    name: circle.circleName,
    contribution: formatBigInt(circle.contributionAmount),
    frequency: circle.frequency,
    totalPositions: maxMembersCount,
    currentPosition:
      combinedMembers.find(
        (m) => m.id.toLowerCase() === userAddress?.toLowerCase(),
      )?.position || 0,
    payoutAmount: formatBigInt(payoutAmountBigInt),
    nextPayout: calculateNextPayout(
      circle.startedAt,
      circle.frequency,
      circle.currentRound,
    ),
    status: getStateText(circle.state),
    membersList: combinedMembers,
    currentRound: circle.currentRound,
    contributionDeadline: contributionDeadlineBigInt.toString(),
    baseDeadline: baseDeadlineBigInt.toString(),
    votingEvents,
    votes,
    voteResults,
    positions: (circle.members || []).map((m) => ({
      user: m.user,
      position: m.position,
    })),
    payouts,
    hasContributed: false,
    userTotalContributed,
    hasWithdrawn:
      circle.state === 4 || circle.state === 5
        ? userMember
          ? !userMember.isActive
          : false
        : false,
    hasReceivedCollateral:
      circle.state === 4 && userMember ? userMember.isActive === false : false,
    isForfeited: userMember ? userMember.isForfeited : false,
    isForfeitedThisRound: false,
    forfeitedAmount: "0",
    forfeitedContributionPortion: "0",
    forfeitCount: 0,
    isPastDeadline: baseDeadlineBigInt > 0n && now > baseDeadlineBigInt,
    isGracePeriod:
      baseDeadlineBigInt > 0n &&
      now > baseDeadlineBigInt &&
      now <= contributionDeadlineBigInt,
    collateralLocked,
    collateralRequired,
    collateralDeadline: contributionDeadlineBigInt.toString(),
    rawCircle: circle,
  };
};
