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
  user: { id: string };
  joinedAt: string;
  position: number;
}

export interface Circle {
  id: string;
  circleName: string;
  circleDescription: string;
  goalAmount: string;
  contributionAmount: string;
  collateralAmount: string;
  frequency: number;
  totalRounds: number;
  currentRound: number;
  startDate: string;
  token: string;
  isActive: boolean;
}

export interface UserCircle {
  id: string;
  joinedAt: string;
  circle: Circle;
}

export interface SubgraphSavingsResponse {
  user: {
    personalGoals: RawPersonalGoal[];
    circles: UserCircle[];
  } | null;
}
