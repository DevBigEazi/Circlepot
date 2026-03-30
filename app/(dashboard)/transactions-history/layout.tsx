import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transaction History",
  description:
    "View your complete transaction history including deposits, withdrawals, and circle payouts on Circlepot.",
};

export default function TransactionsHistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
