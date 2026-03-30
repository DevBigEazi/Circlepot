import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
  description:
    "View and manage your Circlepot profile, account details, and savings history.",
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
