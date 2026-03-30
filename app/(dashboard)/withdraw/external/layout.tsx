import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Withdraw to Wallet",
  description:
    "Withdraw your savings to an external wallet address on Circlepot.",
};

export default function ExternalWithdrawLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
