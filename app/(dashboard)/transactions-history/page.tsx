"use client";

import React from "react";
import { useThemeColors } from "@/app/hooks/useThemeColors";
import NavBar from "@/app/components/NavBar";
import { useRouter } from "next/navigation";

export default function TransactionsHistoryPage() {
  const colors = useThemeColors();
  const router = useRouter();

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: colors.background }}
    >
      <NavBar
        variant="minimal"
        title="Transactions"
        onBack={() => router.back()}
        colors={colors}
      />
      <div className="p-3 sm:p-4">
        <p style={{ color: colors.text, opacity: 0.7 }}>
          View your transaction history.
        </p>
      </div>
    </div>
  );
}
