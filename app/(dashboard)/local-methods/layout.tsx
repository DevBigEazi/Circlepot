import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Local Payment Methods",
  description:
    "Set up local deposit and withdrawal methods to move funds in and out of your Circlepot account.",
};

export default function LocalMethodsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
