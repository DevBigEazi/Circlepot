"use client";

import { useThemeColors } from "@/app/hooks/useThemeColors";
import { useUserProfile } from "@/app/hooks/useUserProfile";
import { useBalance } from "@/app/hooks/useBalance";
import { useCreditScore } from "@/app/hooks/useCreditScore";
import NavBar from "@/app/components/NavBar";
import BalanceDisplay from "@/app/components/BalanceDisplay";
import AddFundsModal from "@/app/components/modals/AddFundsModal";
import WithdrawModal from "@/app/components/modals/WithdrawModal";
import { RecentTransactions } from "@/app/components/RecentTransactions";
import { Bell, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSavings } from "@/app/components/SavingsProvider";
import { useMemo, useState } from "react";
import { formatUnits } from "viem";

export default function Home() {
  const colors = useThemeColors();
  const { profile } = useUserProfile();
  const { formattedBalance, isLoading: isBalanceLoading } = useBalance();
  const { data: creditScore, isLoading: isCreditLoading } = useCreditScore();
  const { personalGoals, circles, isLoading: isSavingsLoading } = useSavings();
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const router = useRouter();

  const personalSavingsCommitted = useMemo(() => {
    const active = personalGoals.filter((g) => g.isActive);
    return active.reduce(
      (acc, goal) =>
        acc + Number(formatUnits(BigInt(goal.currentAmount || "0"), 6)),
      0,
    );
  }, [personalGoals]);

  const circleMetrics = useMemo(() => {
    let contributions = 0;
    let collateral = 0;

    circles.forEach((circle) => {
      contributions += Number(circle.userTotalContributed || 0);
      collateral += Number(circle.collateralLocked || 0);
    });

    return { contributions, collateral };
  }, [circles]);

  const actions = (
    <div className="flex gap-1 sm:gap-2">
      <button
        onClick={() => router.push("/notifications")}
        className="p-1.5 sm:p-2 rounded-xl relative transition hover:opacity-80 border"
        style={{ color: colors.text, borderColor: colors.border }}
      >
        <Bell size={16} />
      </button>
      <button
        onClick={() => router.push("/settings")}
        className="p-1.5 sm:p-2 rounded-xl transition hover:opacity-80 border"
        style={{ color: colors.text, borderColor: colors.border }}
      >
        <Settings size={16} />
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

      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-12">
        <div className="flex flex-col gap-8">
          {/* Main Balance Section */}
          <BalanceDisplay
            balance={formattedBalance}
            creditScore={creditScore}
            circleContributions={circleMetrics.contributions}
            circleCollateral={circleMetrics.collateral}
            personalSavingsCommitted={personalSavingsCommitted}
            isLoading={isBalanceLoading || isCreditLoading || isSavingsLoading}
            onAddClick={() => setShowAddFundsModal(true)}
            onWithdrawClick={() => setShowWithdrawModal(true)}
          />

          {/* Activity Feed Section */}
          <RecentTransactions limit={5} />
        </div>
      </main>

      <AddFundsModal
        isOpen={showAddFundsModal}
        onClose={() => setShowAddFundsModal(false)}
      />

      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
      />
    </div>
  );
}
