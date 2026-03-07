"use client";

import { useState, useMemo } from "react";
import { useThemeColors } from "@/app/hooks/useThemeColors";
import NavBar from "@/app/components/NavBar";
import { useRouter } from "next/navigation";
import {
  User,
  Users,
  Plus,
  Target,
  TrendingUp,
  CheckCircle2,
  Activity,
  UserPlus,
} from "lucide-react";
import PersonalGoalCard from "@/app/components/PersonalGoalCard";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { formatUnits } from "viem";
import { GoalContributionModal } from "@/app/components/modals/GoalContributionModal";
import { GoalWithdrawalModal } from "@/app/components/modals/GoalWithdrawalModal";
import { usePersonalGoals } from "@/app/hooks/usePersonalGoals";
import { useSavings } from "@/app/components/SavingsProvider";
import { toast } from "sonner";
import { PersonalGoal } from "@/app/types/savings";
import { useQueryClient } from "@tanstack/react-query";

export default function SavingsPage() {
  const colors = useThemeColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("personal");
  const [activeModal, setActiveModal] = useState<{
    type: "contribute" | "withdraw" | null;
    goal: PersonalGoal | null;
  }>({
    type: null,
    goal: null,
  });

  const {
    personalGoals,
    circles,
    totalGoalsCompleted,
    totalCirclesCompleted,
    isLoading,
  } = useSavings();
  const {
    contributeToGoal,
    withdrawFromGoal,
    completeGoal,
    isContributing,
    isWithdrawing,
  } = usePersonalGoals();

  /**
   * Universal helper to handle the post-transaction sync period
   */
  const handleTransactionSync = async (
    action: () => Promise<unknown>,
    options: {
      loadingMsg: string;
      successMsg: string;
      shouldRedirect?: boolean;
    },
  ) => {
    try {
      await action();
      setActiveModal({ type: null, goal: null });
      toast.info(options.loadingMsg);

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["balance"] });
        queryClient.invalidateQueries({ queryKey: ["personalGoals"] });
        queryClient.invalidateQueries({ queryKey: ["savingsActivity"] });
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        toast.success(options.successMsg);
        if (options.shouldRedirect) {
          router.push("/dashboard");
        }
      }, 2500);
    } catch (err: unknown) {
      console.error(err);
      const errorMessage =
        err instanceof Error ? err.message : "Action failed. Please try again.";
      toast.error(errorMessage);
    }
  };

  const handleContribute = async (amount: number) => {
    if (!activeModal.goal) return;
    await handleTransactionSync(
      () =>
        contributeToGoal(
          activeModal.goal!.goalId.toString(),
          amount.toString(),
        ),
      {
        loadingMsg: "Syncing contribution...",
        successMsg: "Contribution successful!",
      },
    );
  };

  const handleEarlyWithdraw = async (amount: number) => {
    if (!activeModal.goal) return;
    await handleTransactionSync(
      () =>
        withdrawFromGoal(
          activeModal.goal!.goalId.toString(),
          amount.toString(),
        ),
      {
        loadingMsg: "Updating your dashboard...",
        successMsg: "Withdrawal successful!",
        shouldRedirect: true,
      },
    );
  };

  const handleCompleteWithdraw = async () => {
    if (!activeModal.goal) return;
    await handleTransactionSync(
      () => completeGoal(activeModal.goal!.goalId.toString()),
      {
        loadingMsg: "Finalizing goal completion...",
        successMsg: "Goal completed successfully!",
        shouldRedirect: true,
      },
    );
  };

  const tabs = [
    { id: "personal", label: "Personal" },
    { id: "group", label: "Group" },
  ];

  // Personal Metrics
  const personalMetrics = useMemo(() => {
    const active = personalGoals.filter((g: PersonalGoal) => g.isActive);
    const personal = active.reduce(
      (acc: number, goal: PersonalGoal) =>
        acc + Number(formatUnits(BigInt(goal.currentAmount || "0"), 6)),
      0,
    );

    return [
      {
        label: "Total Saved",
        value: `$${personal.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
        icon: <TrendingUp size={16} />,
        color: colors.primary,
      },
      {
        label: "Active Goals",
        value: active.length.toString(),
        icon: <Activity size={16} />,
        color: colors.text,
      },
      {
        label: "Completed",
        value: totalGoalsCompleted.toString(),
        icon: <CheckCircle2 size={16} />,
        color: "#10b981",
      },
    ];
  }, [personalGoals, totalGoalsCompleted, colors]);

  // Group Metrics (Placeholders for now)
  const groupMetrics = useMemo(() => {
    return [
      {
        label: "Active Circles",
        value: circles.length.toString(),
        icon: <Users size={16} />,
        color: colors.primary,
      },
      {
        label: "My Contributions",
        value: "$0.00",
        icon: <TrendingUp size={16} />,
        color: colors.text,
      },
      {
        label: "Total Payouts",
        value: totalCirclesCompleted.toString(),
        icon: <UserPlus size={16} />,
        color: "#10b981",
      },
    ];
  }, [circles, totalCirclesCompleted, colors]);

  return (
    <div
      className="min-h-screen pb-24"
      style={{ backgroundColor: colors.background }}
    >
      <NavBar
        variant="tabs"
        title="My Savings"
        subtitle={
          activeTab === "personal" ? "Individual Goals" : "Savings Circles"
        }
        onBack={() => router.back()}
        colors={colors}
      />

      <main className="max-w-4xl mx-auto px-4 mt-8 space-y-10">
        {/* Tab Switcher */}
        <div
          className="flex p-1.5 rounded-2xl bg-opacity-50"
          style={{ backgroundColor: `${colors.surface}` }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl font-black uppercase tracking-widest transition-all duration-500 text-[10px] sm:text-xs"
                style={
                  isActive
                    ? {
                        backgroundColor: colors.background,
                        color: colors.primary,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                      }
                    : { color: colors.text, opacity: 0.3 }
                }
              >
                {tab.id === "personal" ? (
                  <User size={16} />
                ) : (
                  <Users size={16} />
                )}
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "personal" ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-3 duration-500">
            {/* Summary Metrics Row */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {personalMetrics.map((card, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl sm:rounded-3xl p-3 sm:p-5 border transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 min-w-0"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }}
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider opacity-40 truncate pr-1">
                      {card.label}
                    </span>
                    <span
                      className="scale-75 sm:scale-100 origin-right"
                      style={{ color: card.color }}
                    >
                      {card.icon}
                    </span>
                  </div>
                  <div
                    className="text-lg sm:text-2xl font-black tracking-tight truncate"
                    style={{ color: colors.text }}
                  >
                    {card.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center px-1">
                <h2
                  className="text-xl sm:text-2xl font-black tracking-tight"
                  style={{ color: colors.text }}
                >
                  Active Goals
                </h2>
                <button
                  onClick={() => router.push("/create/personal-goal")}
                  className="flex items-center gap-1 sm:gap-1.5 py-2 sm:py-3 px-3 sm:px-5 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wider text-white transition-all hover:opacity-90 active:scale-95 shadow-xl shadow-primary/20"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Plus size={14} className="sm:w-4 sm:h-4" /> Create New
                </button>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <LoadingSpinner />
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-30">
                    Syncing goals...
                  </p>
                </div>
              ) : personalGoals.filter((g: PersonalGoal) => g.isActive).length >
                0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {personalGoals
                    .filter((g: PersonalGoal) => g.isActive)
                    .map((goal: PersonalGoal) => (
                      <PersonalGoalCard
                        key={goal.id}
                        goal={goal}
                        onContribute={(e) => {
                          e.stopPropagation();
                          setActiveModal({ type: "contribute", goal });
                        }}
                        onWithdraw={(e) => {
                          e.stopPropagation();
                          setActiveModal({ type: "withdraw", goal });
                        }}
                      />
                    ))}
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center py-20 px-6 text-center rounded-4xl border-2 border-dashed"
                  style={{
                    borderColor: colors.border,
                    backgroundColor: `${colors.surface}40`,
                  }}
                >
                  <div
                    className="w-20 h-20 rounded-4xl flex items-center justify-center mb-6 shadow-2xl shadow-primary/10"
                    style={{
                      backgroundColor: colors.background,
                      color: colors.primary,
                    }}
                  >
                    <Target size={40} />
                  </div>
                  <h3
                    className="font-black text-2xl tracking-tight mb-2"
                    style={{ color: colors.text }}
                  >
                    No Active Goals
                  </h3>
                  <p
                    className="text-sm opacity-50 max-w-[240px] mb-8 font-medium leading-relaxed"
                    style={{ color: colors.text }}
                  >
                    Start your savings journey by setting a milestone and saving
                    towards it.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-3 duration-500">
            {/* Summary Metrics Row */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {groupMetrics.map((card, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl sm:rounded-3xl p-3 sm:p-5 border opacity-50 transition-all duration-300 min-w-0"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }}
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider opacity-40 truncate pr-1">
                      {card.label}
                    </span>
                    <span
                      className="scale-75 sm:scale-100 origin-right"
                      style={{ color: card.color }}
                    >
                      {card.icon}
                    </span>
                  </div>
                  <div
                    className="text-lg sm:text-2xl font-black tracking-tight truncate"
                    style={{ color: colors.text }}
                  >
                    {card.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center px-1">
                <h2
                  className="text-xl sm:text-2xl font-black tracking-tight"
                  style={{ color: colors.text }}
                >
                  Savings Circles
                </h2>
                <button
                  onClick={() => router.push("/circles/create")}
                  className="flex items-center gap-1 sm:gap-1.5 py-2 sm:py-3 px-3 sm:px-5 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wider text-white transition-all hover:opacity-90 active:scale-95 shadow-xl shadow-primary/20"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Plus size={14} className="sm:w-4 sm:h-4" /> Create Circle
                </button>
              </div>

              <div
                className="p-10 rounded-4xl border-2 border-dashed flex flex-col items-center text-center gap-6"
                style={{
                  backgroundColor: `${colors.surface}40`,
                  borderColor: colors.border,
                }}
              >
                <div
                  className="w-20 h-20 rounded-4xl flex items-center justify-center shadow-inner"
                  style={{
                    backgroundColor: colors.background,
                    color: colors.primary,
                  }}
                >
                  <Users size={40} />
                </div>
                <div className="space-y-3">
                  <h4
                    className="font-black text-2xl tracking-tight"
                    style={{ color: colors.text }}
                  >
                    Circle Synchronization
                  </h4>
                  <p
                    className="text-sm opacity-50 leading-relaxed max-w-sm font-medium"
                    style={{ color: colors.text }}
                  >
                    Join or create a Circle to save together with friends. Group
                    data is currently being synced from the blockchain.
                  </p>
                </div>
                <button
                  onClick={() => router.push("/circles/browse")}
                  className="py-3 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2 transition-all hover:bg-primary hover:text-white hover:border-primary"
                  style={{ borderColor: colors.border, color: colors.text }}
                >
                  Browse Circles
                </button>
              </div>
            </div>

            {/* Placeholder for Circles */}
            <div className="opacity-5 pointer-events-none grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-56 rounded-[2.5rem] border-4"
                  style={{ borderColor: colors.border }}
                ></div>
              ))}
            </div>
          </div>
        )}
      </main>

      {activeModal.type === "contribute" && activeModal.goal && (
        <GoalContributionModal
          key={activeModal.goal.id}
          isOpen={true}
          goalName={activeModal.goal.goalName}
          defaultAmount={Number(
            formatUnits(BigInt(activeModal.goal.contributionAmount), 6),
          )}
          isLoading={isContributing}
          onClose={() => setActiveModal({ type: null, goal: null })}
          onContribute={handleContribute}
        />
      )}

      {activeModal.type === "withdraw" && activeModal.goal && (
        <GoalWithdrawalModal
          key={`withdraw-${activeModal.goal.id}`}
          isOpen={true}
          goalName={activeModal.goal.goalName}
          currentAmount={Number(
            formatUnits(BigInt(activeModal.goal.currentAmount || "0"), 6),
          )}
          targetAmount={Number(
            formatUnits(BigInt(activeModal.goal.goalAmount || "0"), 6),
          )}
          isLoading={isWithdrawing}
          onClose={() => setActiveModal({ type: null, goal: null })}
          onCompleteWithdraw={handleCompleteWithdraw}
          onEarlyWithdraw={handleEarlyWithdraw}
        />
      )}
    </div>
  );
}
