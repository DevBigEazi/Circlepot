export type TransactionType =
  | "send"
  | "receive"
  | "circle_joined"
  | "circle_created"
  | "circle_contribution"
  | "circle_payout"
  | "circle_collateral_return"
  | "goal_contribution"
  | "goal_withdrawal"
  | "goal_completion"
  | "referral_reward"
  | "circle_forfeit";

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
  fromName?: string;
  toName?: string;
  metadata?: {
    circleName?: string;
    goalName?: string;
    note?: string;
    payoutFee?: string;
    deadFee?: string;
    forfeitFee?: string;
  };
}
