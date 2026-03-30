import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Savings",
  description:
    "Manage your personal savings goals and group savings circles on Circlepot.",
};

export default function SavingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
