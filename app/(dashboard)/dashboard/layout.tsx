import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "View your savings overview, active circles, and personal goals on Circlepot.",
};

export default function DashboardPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
