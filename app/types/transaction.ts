export type TransactionType =
  | "send"
  | "receive"
  | "circle_contribution"
  | "circle_payout"
  | "goal_contribution"
  | "goal_withdrawal"
  | "goal_completion"
  | "referral_reward";

export interface Transaction {
  id: string; // Typically transactionHash + logIndex
  type: TransactionType;
  amount: string; // Formatted amount
  currency: string; // e.g., "USDT"
  timestamp: number;
  status: "success" | "pending" | "failed";
  hash: string;
  from: string;
  to: string;
  displayName?: string; // Username if found, else shortened address
  displayPhoto?: string;
  isIncoming: boolean;
  metadata?: {
    circleName?: string;
    goalName?: string;
    note?: string;
  };
}
