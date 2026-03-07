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
  joinedAt: string;
  position: number;
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
  creator: {
    id: string;
  };
  members?: {
    id: string;
    user: { id: string };
    joinedAt: string;
    position: number;
  }[];
}

export interface CircleCreator {
  id: string;
  username?: string;
  fullName?: string;
  avatarUrl?: string; // From MongoDB profile
}

export interface Circle {
  id: string;
  circleId: string;
  creator: CircleCreator;
  circleName: string;
  circleDescription: string;
  contributionAmount: string;
  collateralAmount: string;
  frequency: number; // 0: Daily, 1: Weekly, 2: Monthly
  maxMembers: string;
  currentMembers: string;
  currentRound: string;
  visibility: number; // 0: Private, 1: Public
  state: number; // 1: CREATED, 2: VOTING, 3: ACTIVE, 4: COMPLETED, 5: DEAD
  createdAt: string;
  startedAt: string;
  updatedAt: string;
  token: string;
}

export interface UserCircle {
  id: string;
  joinedAt: string;
  circle: Circle;
}

export interface SubgraphSavingsResponse {
  user: {
    id: string;
    totalGoalsCompleted: string;
    totalCirclesCompleted: string;
    personalGoals: RawPersonalGoal[];
    circles: UserCircle[];
  } | null;
}
