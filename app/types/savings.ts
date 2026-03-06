export interface PersonalGoal {
  id: string;
  owner: string;
  name: string;
  targetAmount: string;
  currentAmount: string;
  contributionAmount: string;
  frequency: number;
  deadline: string;
  createdAt: string;
  isActive: boolean;
  lastContributionAt: string;
  isYieldEnabled: boolean;
  contributionCount: string;
  token: string;
}

export interface CircleMember {
  id: string;
  user: { id: string };
  joinedAt: string;
  position: number;
}

export interface Circle {
  id: string;
  name: string;
  description: string;
  targetAmount: string;
  contributionAmount: string;
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
    personalGoals: PersonalGoal[];
    circles: UserCircle[];
  } | null;
}
