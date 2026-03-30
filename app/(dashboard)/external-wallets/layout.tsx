import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "External Wallets",
  description:
    "Manage your connected external wallets for deposits and withdrawals on Circlepot.",
};

export default function ExternalWalletsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
