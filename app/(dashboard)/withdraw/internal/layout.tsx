import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transfer to Member",
  description:
    "Transfer funds to another Circlepot member directly from your account.",
};

export default function InternalWithdrawLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
