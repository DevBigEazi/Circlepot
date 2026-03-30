import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications",
  description:
    "Stay updated with your savings activity, circle payouts, and important alerts on Circlepot.",
};

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
