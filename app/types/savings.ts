export interface PersonalGoal {
  id: string;
  goalId: string;
  owner: string;
  goalName: string;
  goalAmount: string;
  currentAmount: string;
  contributionAmount: string;
  frequency: number;
  deadline: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  lastContributionAt: string;
  isYieldEnabled: boolean;
  token: string;
}

export interface RawPersonalGoal {
  id?: string;
  goalId?: string;
  owner?: string;
  goalName?: string;
  goalAmount?: string;
  currentAmount?: string;
  contributionAmount?: string;
  frequency?: string | number;
  deadline?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
  lastContributionAt?: string;
  isYieldEnabled?: boolean;
  token?: string;
}

export const transformPersonalGoal = (data: RawPersonalGoal): PersonalGoal => ({
  id: data?.id || "",
  goalId: data?.goalId || "0",
  owner: data?.owner || "",
  goalName: data?.goalName || "Unnamed Goal",
  goalAmount: data?.goalAmount || "0",
  currentAmount: data?.currentAmount || "0",
  contributionAmount: data?.contributionAmount || "0",
  frequency: Number(data?.frequency) || 0,
  deadline: data?.deadline || "0",
  createdAt: data?.createdAt || "0",
  updatedAt: data?.updatedAt || "0",
  isActive: !!data?.isActive,
  lastContributionAt: data?.lastContributionAt || "0",
  isYieldEnabled: !!data?.isYieldEnabled,
  token: data?.token || "",
});

export interface CircleMember {
  id: string;
  user: {
    id: string;
    username?: string;
    fullName?: string;
  };
  totalContributed: string;
  collateralLocked: string;
  avatar?: string | null;
  joinedAt: string;
  position: number;
  isActive: boolean;
  hasReceivedPayout: boolean;
  isForfeited: boolean;
}

export interface RawCircle {
  id: string;
  circleId: string;
  circleName: string;
  circleDescription: string;
  contributionAmount: string;
  collateralAmount: string;
  frequency: number;
  maxMembers: string;
  currentMembers: string;
  currentRound: string;
  visibility: number;
  state: number;
  createdAt: string;
  startedAt: string;
  updatedAt: string;
  token: string;
  totalPot: string;
  creator: {
    id: string;
  };
  members?: {
    id: string;
    user: { id: string };
    totalContributed: string;
    collateralLocked: string;
    joinedAt: string;
    avatar?: string | null;
    avatarUrl?: string | null;
    position: number;
    isActive: boolean;
    hasReceivedPayout: boolean;
  }[];
}

export interface CircleCreator {
  id: string;
  username?: string;
  fullName?: string;
  avatarUrl?: string | null;
}

export interface Circle {
  id: string;
  circleId: string;
  creator: CircleCreator;
  circleName: string;
  circleDescription: string;
  contributionAmount: string;
  collateralAmount: string;
  frequency: number;
  maxMembers: string;
  currentMembers: string;
  currentRound: string;
  visibility: number;
  state: number;
  createdAt: string;
  startedAt: string;
  updatedAt: string;
  token: string;
  totalPot: string;
  contributionsThisRound?: string;
  nextDeadline?: string;
  lastVoteExecuted?: {
    id: string;
    circleStarted: boolean;
    startVoteTotal: string;
    withdrawVoteTotal: string;
    withdrawWon: boolean;
  } | null;
  members?: CircleMember[];
}

export interface ActiveCircle {
  id: string;
  name: string;
  contribution: string;
  frequency: number;
  totalPositions: number;
  currentPosition: number;
  payoutAmount: string;
  nextPayout: string;
  status:
    | "pending"
    | "created"
    | "voting"
    | "active"
    | "completed"
    | "dead"
    | "unknown";
  membersList: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl?: string | null;
    isActive: boolean;
    hasContributed: boolean;
    position: number;
    hasReceivedPayout: boolean;
  }[];
  currentRound: string;
  contributionDeadline: string;
  baseDeadline: string;
  votingEvents: Record<string, unknown>[];
  votes: Record<string, unknown>[];
  voteResults: Record<string, unknown>[];
  positions: Record<string, unknown>[];
  payouts: CirclePayout[];
  hasContributed: boolean;
  userTotalContributed: string;
  hasWithdrawn: boolean;
  hasReceivedCollateral: boolean;
  isForfeited: boolean;
  isForfeitedThisRound: boolean;
  forfeitedAmount: string;
  forfeitedContributionPortion: string;
  forfeitCount: number;
  isYieldEnabled?: boolean;
  yieldAPY?: string;
  isPastDeadline: boolean;
  isGracePeriod: boolean;
  collateralLocked: string;
  collateralRequired: string;
  collateralDeadline: string;
  rawCircle: Circle;
}

export type CircleActionData = ActiveCircle & {
  lateMembers?: string[];
  choice?: number;
};

export interface UserCircle {
  id: string;
  joinedAt: string;
  circle: Circle;
}

export interface CirclePayout {
  id: string;
  user: {
    id: string;
    username: string;
    fullName: string;
  };
  round: string;
  payoutAmount: string;
  timestamp: string;
}

export interface SubgraphSavingsResponse {
  user: {
    id: string;
    totalGoalsCompleted: string;
    totalCirclesCompleted: string;
    totalReputation: string;
    repCategory: number;
    totalLatePayments: string;
  } | null;
}
