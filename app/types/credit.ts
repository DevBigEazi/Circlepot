export enum ScoreCategory {
  POOR = 0,
  FAIR = 1,
  GOOD = 2,
  VERY_GOOD = 3,
  EXCEPTIONAL = 4,
}

export interface CreditScore {
  score: number;
  category: ScoreCategory;
  categoryLabel: string;
  categoryColor: string;
  totalCirclesCompleted: number;
  totalGoalsCompleted: number;
  totalLatePayments: number;
}

export interface ReputationIncrease {
  id: string;
  points: bigint;
  reason: string;
  timestamp: bigint;
  transactionHash: string;
}

export interface ReputationDecrease {
  id: string;
  points: bigint;
  reason: string;
  timestamp: bigint;
  transactionHash: string;
}

export interface ScoreCategoryChange {
  id: string;
  oldCategory: number;
  newCategory: number;
  timestamp: bigint;
  transactionHash: string;
}

export interface CircleCompletion {
  id: string;
  circleId: bigint;
  timestamp: bigint;
  transactionHash: string;
}

export interface LatePaymentRecord {
  id: string;
  circleId: bigint;
  round: bigint;
  fee: bigint;
  timestamp: bigint;
  transactionHash: string;
}

export interface GoalCompletion {
  id: string;
  goalId: bigint;
  timestamp: bigint;
  transactionHash: string;
}
