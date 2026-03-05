"use client";

import React from "react";
import { useThemeColors } from "@/app/hooks/useThemeColors";
import { useUserProfile } from "@/app/hooks/useUserProfile";
import { useBalance } from "@/app/hooks/useBalance";
import { useCreditScore } from "@/app/hooks/useCreditScore";
import NavBar from "@/app/components/NavBar";
import BalanceDisplay from "@/app/components/BalanceDisplay";
import { History, Bell, Settings, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Home() {
  const colors = useThemeColors();
  const { profile } = useUserProfile();
  const { formattedBalance, isLoading: isBalanceLoading } = useBalance();
  const { data: creditScore, isLoading: isCreditLoading } = useCreditScore();
  const router = useRouter();

  const actions = (
    <div className="flex gap-1 sm:gap-2">
      <button
        onClick={() => router.push("/transactions-history")}
        className="p-1.5 sm:p-2 rounded-xl transition hover:opacity-80"
        style={{ color: colors.text }}
      >
        <History className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px]" />
      </button>
      <button
        onClick={() => router.push("/notifications")}
        className="p-1.5 sm:p-2 rounded-xl relative transition hover:opacity-80"
        style={{ color: colors.text }}
      >
        <Bell className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px]" />
      </button>
      <button
        onClick={() => router.push("/settings")}
        className="p-1.5 sm:p-2 rounded-xl transition hover:opacity-80"
        style={{ color: colors.text }}
      >
        <Settings className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px]" />
      </button>
    </div>
  );

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: colors.background }}
    >
      <NavBar
        colors={colors}
        userName={profile?.username}
        fullName={`${profile?.firstName || ""} ${profile?.lastName || ""}`.trim()}
        profileImage={profile?.profilePhoto}
        actions={actions}
      />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
          {/* Left Column: Balance & Goals (2/5 width on lg) */}
          <div className="lg:col-span-2 space-y-6">
            <BalanceDisplay
              balance={formattedBalance}
              creditScore={creditScore}
              isLoading={isBalanceLoading || isCreditLoading}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
