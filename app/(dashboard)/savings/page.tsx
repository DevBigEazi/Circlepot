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
} from "lucide-react";
import PersonalGoalCard from "@/app/components/PersonalGoalCard";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { formatUnits } from "viem";
import { GoalContributionModal } from "@/app/components/modals/GoalContributionModal";
import { GoalWithdrawalModal } from "@/app/components/modals/GoalWithdrawalModal";
import { usePersonalGoals } from "@/app/hooks/usePersonalGoals";
import { useSavings } from "@/app/components/SavingsProvider";
import { toast } from "sonner";
import {
  PersonalGoal,
  ActiveCircle,
  CircleActionData,
} from "@/app/types/savings";
import { useQueryClient } from "@tanstack/react-query";
import { useCircleSavings } from "@/app/hooks/useCircleSavings";
import { CircleStatistics } from "@/app/components/CircleStatistics";
import ActiveCircleCard from "@/app/components/ActiveCircleCard";
import { CircleDetailsModal } from "@/app/components/modals/CircleDetailsModal";
import { InviteMembersModal } from "@/app/components/modals/InviteMembersModal";
import { CircleChatModal } from "@/app/components/modals/CircleChatModal";
import { WithdrawCollateralModal } from "@/app/components/modals/WithdrawCollateralModal";
import { VoteModal } from "@/app/components/modals/VoteModal";
import { LateContributionModal } from "@/app/components/modals/LateContributionModal";
import { UpdateVisibilityModal } from "@/app/components/modals/UpdateVisibilityModal";

export default function SavingsPage() {
  const colors = useThemeColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("personal");
  const [processingCircleId, setProcessingCircleId] = useState<string | null>(
    null,
  );
  const [activeModal, setActiveModal] = useState<{
    type:
      | "contribute"
      | "withdraw"
      | "circle-details"
      | "circle-chat"
      | "invite"
      | "vote"
      | "late-contribute"
      | "withdraw-collateral"
      | "update-visibility"
      | null;
    goal: PersonalGoal | null;
    circle: ActiveCircle | null;
  }>({
    type: null,
    goal: null,
    circle: null,
  });

  const {
    personalGoals,
    circles,
    totalGoalsCompleted,
    reputation,
    totalSavedCircles,
    totalPayoutsCircles,
    isLoading,
    address,
  } = useSavings();
  const {
    contributeToGoal,
    isContributing,
    withdrawFromGoal,
    completeGoal,
    isWithdrawing,
  } = usePersonalGoals();
  const {
    contribute: contributeToCircle,
    initiateVoting,
    castVote,
    executeVote,
    withdrawCollateral,
    updateCircleVisibility,
    forfeitMember,
    inviteMembers,
    isContributing: isCircleContributing,
    isInitiatingVoting,
    isVoting,
    isExecutingVote,
    isWithdrawingCollateral,
    isInvitingMembers,
    isUpdatingVisibility,
    isForfeiting,
  } = useCircleSavings();

  const isGlobalCircleLoading =
    isCircleContributing ||
    isInitiatingVoting ||
    isVoting ||
    isExecutingVote ||
    isWithdrawingCollateral ||
    isUpdatingVisibility ||
    isForfeiting;

  const handleTransactionSync = async (
    action: () => Promise<unknown>,
    options: {
      loadingMsg: string;
      successMsg: string;
      shouldRedirect?: boolean;
      circleId?: string;
    },
  ) => {
    if (options.circleId) setProcessingCircleId(options.circleId);
    try {
      await action();
      setActiveModal({ type: null, goal: null, circle: null });
      toast.info(options.loadingMsg);

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["balance"] });
        queryClient.invalidateQueries({ queryKey: ["personalGoals"] });
        queryClient.invalidateQueries({ queryKey: ["userSavings"] });
        queryClient.invalidateQueries({ queryKey: ["circlesDetails"] });
        toast.success(options.successMsg);
        if (options.shouldRedirect) {
          router.push("/dashboard");
        }
      }, 2500);
    } catch (err: unknown) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Action failed.");
    } finally {
      if (options.circleId) setProcessingCircleId(null);
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

  const handleWithdraw = async (amount: number) => {
    if (!activeModal.goal) return;
    await handleTransactionSync(
      () =>
        withdrawFromGoal(
          activeModal.goal!.goalId.toString(),
          amount.toString(),
        ),
      {
        loadingMsg: "Processing withdrawal...",
        successMsg: "Withdrawal successful!",
      },
    );
  };

  const handleCompleteWithdraw = async () => {
    if (!activeModal.goal) return;
    await handleTransactionSync(
      () => completeGoal(activeModal.goal!.goalId.toString()),
      {
        loadingMsg: "Completing goal...",
        successMsg: "Goal completed and funds returned!",
      },
    );
  };

  const handleCircleAction = async (
    action: string,
    data?: CircleActionData | null,
  ) => {
    if (!data) return;
    switch (action) {
      case "contribute":
        if (data.isPastDeadline) {
          setActiveModal({ type: "late-contribute", circle: data, goal: null });
        } else {
          await handleTransactionSync(
            () =>
              contributeToCircle(
                data.rawCircle.circleId,
                data.rawCircle.contributionAmount,
              ),
            {
              loadingMsg: "Sending contribution...",
              successMsg: "Contribution successful!",
              circleId: data.rawCircle.circleId,
            },
          );
        }
        break;
      case "initiateVoting":
        await handleTransactionSync(
          () => initiateVoting(data.rawCircle.circleId),
          {
            loadingMsg: "Initiating vote...",
            successMsg: "Voting period started!",
            circleId: data.rawCircle.circleId,
          },
        );
        break;
      case "vote":
        setActiveModal({ type: "vote", circle: data, goal: null });
        break;
      case "executeVote":
        await handleTransactionSync(
          () => executeVote(data.rawCircle.circleId),
          {
            loadingMsg: "Finalizing results...",
            successMsg: "Circle status updated!",
            circleId: data.rawCircle.circleId,
          },
        );
        break;
      case "withdrawCollateral":
        setActiveModal({
          type: "withdraw-collateral",
          circle: data,
          goal: null,
        });
        break;
      case "details":
        setActiveModal({ type: "circle-details", circle: data, goal: null });
        break;
      case "chat":
        setActiveModal({ type: "circle-chat", circle: data, goal: null });
        break;
      case "invite":
        setActiveModal({ type: "invite", circle: data, goal: null });
        break;
      case "updateVisibility":
        setActiveModal({ type: "update-visibility", circle: data, goal: null });
        break;
      case "forfeit":
        const lateMembers = data?.lateMembers;
        if (!lateMembers || lateMembers.length === 0) {
          toast.error("No units detected for forfeiture.");
          return;
        }
        await handleTransactionSync(
          () => forfeitMember(data!.rawCircle.circleId, lateMembers),
          {
            loadingMsg: `Forfeiting ${lateMembers.length} member${lateMembers.length > 1 ? "s" : ""}...`,
            successMsg: "Forfeit successful!",
            circleId: data!.rawCircle.circleId,
          },
        );
        break;
    }
  };

  const tabs = [
    { id: "personal", label: "Personal" },
    { id: "group", label: "Group" },
  ];

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
        value: `$${personal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
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

  const activeCircleCount = useMemo(() => {
    return circles.filter(
      (c) =>
        c.status === "created" ||
        c.status === "voting" ||
        c.status === "active",
    ).length;
  }, [circles]);

  return (
    <div
      className="min-h-screen pb-12"
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

      <main className="max-w-4xl mx-auto px-4 mt-2 space-y-2">
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
                className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2.5 py-2.5 sm:py-3 rounded-xl font-black uppercase tracking-widest transition-all duration-500 text-[9px] sm:text-xs"
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
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                ) : (
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "personal" ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-3 duration-500">
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
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider opacity-40 pr-1">
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
                    className="text-lg sm:text-2xl font-black tracking-tight"
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
                  className="text-lg sm:text-2xl font-black tracking-tight"
                  style={{ color: colors.text }}
                >
                  Active Goals
                </h2>
                <button
                  onClick={() => router.push("/create/personal-goal")}
                  className="flex items-center gap-1 sm:gap-1.5 py-2 sm:py-3 px-3 sm:px-5 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wider text-white transition-all hover:opacity-90 shadow-xl shadow-primary/20"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Plus size={14} /> <span>Create New</span>
                </button>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24">
                  <LoadingSpinner />
                </div>
              ) : personalGoals.filter((g) => g.isActive).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {personalGoals
                    .filter((g) => g.isActive)
                    .map((goal) => (
                      <PersonalGoalCard
                        key={goal.id}
                        goal={goal}
                        onContribute={() =>
                          setActiveModal({
                            type: "contribute",
                            goal,
                            circle: null,
                          })
                        }
                        onWithdraw={() =>
                          setActiveModal({
                            type: "withdraw",
                            goal,
                            circle: null,
                          })
                        }
                      />
                    ))}
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center px-4 py-20 border-2 border-dashed rounded-4xl"
                  style={{
                    borderColor: colors.border,
                    backgroundColor: `${colors.surface}40`,
                  }}
                >
                  <Target size={40} style={{ color: colors.primary }} />
                  <h3
                    className="font-black text-2xl mt-4"
                    style={{ color: colors.text }}
                  >
                    No Active Goals
                  </h3>
                  <p className="text-sm opacity-50 mt-2 font-medium text-center">
                    Start your savings journey today.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-3 duration-500">
            <CircleStatistics
              activeCircles={activeCircleCount}
              totalSaved={totalSavedCircles}
              totalPayouts={totalPayoutsCircles}
              reputation={reputation}
            />

            <div className="space-y-6">
              <div className="flex justify-between items-center px-1">
                <h2
                  className="text-lg sm:text-2xl font-black tracking-tight"
                  style={{ color: colors.text }}
                >
                  Savings Circles
                </h2>
                <button
                  onClick={() => router.push("/create/circle")}
                  className="flex items-center gap-1 sm:gap-1.5 py-2 sm:py-3 px-3 sm:px-5 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wider text-white transition-all hover:opacity-90 shadow-xl shadow-primary/20"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Plus size={14} /> <span>Create Circle</span>
                </button>
              </div>

              {circles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {circles.map((circle) => (
                    <ActiveCircleCard
                      key={circle.id}
                      circle={circle}
                      currentUserAddress={address}
                      onAction={handleCircleAction}
                      isGlobalLoading={isGlobalCircleLoading}
                      isTargetLoading={
                        processingCircleId === circle.rawCircle.circleId
                      }
                    />
                  ))}
                </div>
              ) : (
                <div
                  className="p-10 rounded-4xl border-2 border-dashed flex flex-col items-center gap-6"
                  style={{
                    backgroundColor: `${colors.surface}40`,
                    borderColor: colors.border,
                  }}
                >
                  <Users size={40} style={{ color: colors.primary }} />
                  <h4
                    className="font-black text-2xl"
                    style={{ color: colors.text }}
                  >
                    No Circles Found
                  </h4>
                  <button
                    onClick={() => router.push("/browse")}
                    className="py-3 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2"
                    style={{ borderColor: colors.border, color: colors.text }}
                  >
                    Browse Circles
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modals Mapping */}
      {activeModal.type === "contribute" && activeModal.goal && (
        <GoalContributionModal
          isOpen={true}
          goalName={activeModal.goal.goalName}
          defaultAmount={Number(
            formatUnits(BigInt(activeModal.goal.contributionAmount), 6),
          )}
          isLoading={isContributing}
          onClose={() =>
            setActiveModal({ type: null, goal: null, circle: null })
          }
          onContribute={handleContribute}
        />
      )}
      {activeModal.type === "withdraw" && activeModal.goal && (
        <GoalWithdrawalModal
          isOpen={true}
          goalName={activeModal.goal.goalName}
          currentAmount={Number(
            formatUnits(BigInt(activeModal.goal.currentAmount), 6),
          )}
          targetAmount={Number(
            formatUnits(BigInt(activeModal.goal.goalAmount), 6),
          )}
          isLoading={isWithdrawing}
          onClose={() =>
            setActiveModal({ type: null, goal: null, circle: null })
          }
          onEarlyWithdraw={handleWithdraw}
          onCompleteWithdraw={handleCompleteWithdraw}
        />
      )}
      {activeModal.type === "circle-details" && activeModal.circle && (
        <CircleDetailsModal
          isOpen={true}
          circle={activeModal.circle}
          colors={colors}
          onClose={() =>
            setActiveModal({ type: null, goal: null, circle: null })
          }
        />
      )}
      {activeModal.type === "circle-chat" && activeModal.circle && (
        <CircleChatModal
          isOpen={true}
          circleName={activeModal.circle.name}
          colors={colors}
          onClose={() =>
            setActiveModal({ type: null, goal: null, circle: null })
          }
        />
      )}
      {activeModal.type === "withdraw-collateral" && activeModal.circle && (
        <WithdrawCollateralModal
          isOpen={true}
          circleName={activeModal.circle.name}
          collateralLocked={formatUnits(
            BigInt(
              activeModal.circle.rawCircle.members?.[0]?.collateralLocked ||
                "0",
            ),
            6,
          )}
          creatorDeadFee={(() => {
            const isCreator =
              address?.toLowerCase() ===
              activeModal.circle.rawCircle.creator.id.toLowerCase();
            const isDead = activeModal.circle.status === "dead";
            if (isCreator && isDead) {
              // 1 USD for private (0), 0.5 USD for public (1)
              return activeModal.circle.rawCircle.visibility === 0
                ? "1.00"
                : "0.50";
            }
            return "0.00";
          })()}
          netAmount={(() => {
            const locked = BigInt(
              activeModal.circle.rawCircle.members?.[0]?.collateralLocked ||
                "0",
            );
            const isCreator =
              address?.toLowerCase() ===
              activeModal.circle.rawCircle.creator.id.toLowerCase();
            const isDead = activeModal.circle.status === "dead";
            let fee = 0n;
            if (isCreator && isDead) {
              fee =
                activeModal.circle.rawCircle.visibility === 0
                  ? 1000000n
                  : 500000n;
            }
            return formatUnits(locked - fee, 6);
          })()}
          isCreator={
            address?.toLowerCase() ===
            activeModal.circle.rawCircle.creator.id.toLowerCase()
          }
          withdrawalReason={
            activeModal.circle.status === "completed"
              ? "completed"
              : activeModal.circle.rawCircle.lastVoteExecuted?.withdrawWon
                ? "vote_failed"
                : "below_threshold"
          }
          colors={colors}
          isLoading={isWithdrawingCollateral}
          onClose={() =>
            setActiveModal({ type: null, goal: null, circle: null })
          }
          onConfirm={async () => {
            await handleTransactionSync(
              () => withdrawCollateral(activeModal.circle!.rawCircle.circleId),
              {
                loadingMsg: "Withdrawing...",
                successMsg: "Collateral returned!",
                circleId: activeModal.circle!.rawCircle.circleId,
              },
            );
          }}
        />
      )}
      {activeModal.type === "vote" && activeModal.circle && (
        <VoteModal
          isOpen={true}
          circleName={activeModal.circle.name}
          isLoading={isVoting}
          startVotes={
            activeModal.circle.votes.filter((v) => v.choice === "1").length
          }
          withdrawVotes={
            activeModal.circle.votes.filter((v) => v.choice === "2").length
          }
          totalMembers={Number(activeModal.circle.rawCircle.currentMembers)}
          onClose={() =>
            setActiveModal({ type: null, goal: null, circle: null })
          }
          onVote={async (choice) => {
            await handleTransactionSync(
              () =>
                castVote(
                  activeModal.circle!.rawCircle.circleId,
                  choice ? 1 : 2,
                ),
              {
                loadingMsg: "Casting vote...",
                successMsg: "Vote recorded!",
                circleId: activeModal.circle!.rawCircle.circleId,
              },
            );
          }}
        />
      )}
      {activeModal.type === "late-contribute" && activeModal.circle && (
        <LateContributionModal
          isOpen={true}
          circleName={activeModal.circle.name}
          contributionAmount={activeModal.circle.contribution}
          lateFee={(Number(activeModal.circle.contribution) * 0.01).toString()}
          isLoading={isCircleContributing}
          onClose={() =>
            setActiveModal({ type: null, goal: null, circle: null })
          }
          onConfirm={async () => {
            await handleTransactionSync(
              () =>
                contributeToCircle(
                  activeModal.circle!.rawCircle.circleId,
                  activeModal.circle!.rawCircle.contributionAmount,
                ),
              {
                loadingMsg: "Sending contribution...",
                successMsg: "Contribution successful!",
                circleId: activeModal.circle!.rawCircle.circleId,
              },
            );
          }}
        />
      )}
      {activeModal.type === "invite" && activeModal.circle && (
        <InviteMembersModal
          isOpen={true}
          circleId={activeModal.circle.id}
          circleName={activeModal.circle.name}
          colors={colors}
          isLoading={isInvitingMembers}
          onClose={() =>
            setActiveModal({ type: null, goal: null, circle: null })
          }
          onInvite={async (emails) => {
            await handleTransactionSync(
              () =>
                inviteMembers(activeModal.circle!.rawCircle.circleId, emails),
              {
                loadingMsg: "Sending invites...",
                successMsg: "Invites sent successfully!",
                circleId: activeModal.circle!.rawCircle.circleId,
              },
            );
          }}
        />
      )}
      {activeModal.type === "update-visibility" && activeModal.circle && (
        <UpdateVisibilityModal
          isOpen={true}
          onClose={() =>
            setActiveModal({ type: null, goal: null, circle: null })
          }
          circleId={activeModal.circle.rawCircle.circleId}
          circleName={activeModal.circle.name}
          currentVisibility={activeModal.circle.rawCircle.visibility}
          isLoading={isUpdatingVisibility}
          onUpdate={async (newVisibility) => {
            await handleTransactionSync(
              () =>
                updateCircleVisibility(
                  activeModal.circle!.rawCircle.circleId,
                  newVisibility,
                ),
              {
                loadingMsg: "Updating visibility...",
                successMsg: "Visibility updated successfully!",
                circleId: activeModal.circle!.rawCircle.circleId,
              },
            );
          }}
        />
      )}
    </div>
  );
}
