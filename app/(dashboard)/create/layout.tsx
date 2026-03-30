import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create",
  description:
    "Start a new savings circle or set a personal savings goal on Circlepot.",
};

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
