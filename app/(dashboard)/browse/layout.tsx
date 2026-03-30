import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Circles",
  description:
    "Discover and join community savings circles. Find open ROSCAs with contribution amounts and schedules that match your goals.",
};

export default function BrowseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
