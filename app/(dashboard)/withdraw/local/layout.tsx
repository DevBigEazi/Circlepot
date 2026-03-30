import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Local Withdrawal",
  description:
    "Withdraw your savings using a local payment method on Circlepot.",
};

export default function LocalWithdrawLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
