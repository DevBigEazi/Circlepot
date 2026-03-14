"use client";

import React, { useState } from "react";
import {
  Vote,
  DollarSign,
  UserX,
  CheckCircle,
  Share2,
  UserPlus,
  Info,
  MessageSquare,
  AlertTriangle,
  Settings,
} from "lucide-react";
import { ActiveCircle } from "../types/savings";
import { toast } from "sonner";
import { ThemeColors } from "../hooks/useThemeColors";
import LoadingSpinner from "./LoadingSpinner";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";


interface CircleActionsProps {
  circle: ActiveCircle;
  isCreator: boolean;
  isMember: boolean;
  onContribute: () => void;
  onInitiateVoting: () => void;
  onVote: (choice?: number) => void;
  onExecuteVote: () => void;
  onWithdrawCollateral: () => void;
  onInviteMembers: () => void;
  onForfeit: (lateMembers: string[]) => void;
  onOpenDetails: () => void;
  onOpenChat: () => void;
  onUpdateVisibility: () => void;
  colors: ThemeColors;
  isGlobalLoading?: boolean;
  isTargetLoading?: boolean;
}

export const CircleActions: React.FC<CircleActionsProps> = ({
  circle,
  isCreator,
  isMember,
  onContribute,
  onInitiateVoting,
  onVote,
  onExecuteVote,
  onWithdrawCollateral,
  onInviteMembers,
  onForfeit,
  onOpenDetails,
  onOpenChat,
  onUpdateVisibility,
  colors,
  isGlobalLoading = false,
  isTargetLoading = false,
}) => {
  const { primaryWallet } = useDynamicContext();
  const [isCopying, setIsCopying] = useState(false);
  const [now, setNow] = useState<number>(0);

  React.useEffect(() => {
    setNow(Math.floor(Date.now() / 1000));
    const interval = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const {
    status,
    hasContributed,
    isForfeitedThisRound,
    hasWithdrawn,
    rawCircle,
    currentPosition,
    currentRound,
    isPastDeadline,
  } = circle;

  const handleShare = async () => {
    const url = `${window.location.origin}/join/${rawCircle.circleId}`;
    try {
      setIsCopying(true);
      await navigator.clipboard.writeText(url);
      toast.success("Invite link copied!");
      setTimeout(() => setIsCopying(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const buttonBaseClass =
    "flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl font-black uppercase tracking-widest text-[9px] sm:text-xs transition-all duration-200 active:scale-95 shadow-sm border-2 disabled:opacity-50 disabled:cursor-not-allowed flex-1 min-w-0";

  // State: CREATED (1)
  if (status === "created") {
    // Check Ultimatum & Threshold
    const createdAt = Number(rawCircle.createdAt);
    const ultimatumDuration =
      rawCircle.frequency === 2 ? 14 * 86400 : 7 * 86400;
    const ultimatumPassed = now > createdAt + ultimatumDuration;
    const thresholdReached =
      Number(rawCircle.currentMembers) >=
      Math.ceil(Number(rawCircle.maxMembers) * 0.6);

    return (
      <div
        className="flex flex-col gap-2 pt-4 border-t"
        style={{ borderColor: `${colors.border}40` }}
      >
        <div className="flex flex-wrap gap-2 w-full">
          {ultimatumPassed && thresholdReached && isMember && (
            <button
              onClick={onInitiateVoting}
              disabled={isGlobalLoading}
              className={`${buttonBaseClass} text-white`}
              style={{
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              }}
            >
              {isTargetLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Vote size={14} /> Start Vote
                </>
              )}
            </button>
          )}
          {ultimatumPassed && !thresholdReached && isMember && (
            <button
              onClick={onWithdrawCollateral}
              disabled={isGlobalLoading}
              className={`${buttonBaseClass} text-white`}
              style={{
                backgroundColor: "#f59e0b",
                borderColor: "#f59e0b",
              }}
            >
              {isTargetLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <AlertTriangle size={14} /> Withdraw
                </>
              )}
            </button>
          )}
          {isCreator && rawCircle.visibility === 0 && (
            <button
              onClick={onInviteMembers}
              disabled={isGlobalLoading}
              className={`${buttonBaseClass}`}
              style={{
                borderColor: colors.primary,
                color: colors.primary,
                backgroundColor: `${colors.primary}10`,
              }}
            >
              <UserPlus size={14} /> Invite
            </button>
          )}
          <button
            onClick={handleShare}
            disabled={isGlobalLoading}
            className={`${buttonBaseClass}`}
            style={{
              borderColor: colors.border,
              color: colors.text,
              opacity: 0.7,
            }}
          >
            <Share2 size={14} /> {isCopying ? "Copied" : "Share"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2 w-full">
          <button
            onClick={onOpenDetails}
            disabled={isGlobalLoading}
            className={`${buttonBaseClass}`}
            style={{
              borderColor: colors.border,
              color: colors.text,
              opacity: 0.6,
            }}
          >
            <Info size={14} /> Details
          </button>
          <button
            onClick={onOpenChat}
            disabled={isGlobalLoading}
            className={`${buttonBaseClass}`}
            style={{
              borderColor: colors.border,
              color: colors.text,
              opacity: 0.6,
            }}
          >
            <MessageSquare size={14} /> Chat
          </button>
          {isCreator && !(ultimatumPassed && !thresholdReached) && (
            <button
              onClick={onUpdateVisibility}
              disabled={isGlobalLoading}
              className={`${buttonBaseClass}`}
              style={{
                borderColor: colors.border,
                color: colors.text,
                opacity: 0.6,
              }}
            >
              <Settings size={14} /> Settings
            </button>
          )}
        </div>
      </div>
    );
  }

  // State: VOTING (2)
  if (status === "voting") {
    const userAddress = primaryWallet?.address?.toLowerCase();
    const hasVoted = circle.votes.some(
      (v) => v.voter.id.toLowerCase() === userAddress,
    );

    const latestVoting = circle.votingEvents?.[0];
    const votingEnded = latestVoting
      ? now > Number(latestVoting.votingEndAt)
      : false;

    return (
      <div
        className="flex flex-col gap-3 pt-4 border-t"
        style={{ borderColor: `${colors.border}40` }}
      >
        {isMember && !hasVoted && !votingEnded && (
          <button
            onClick={() => onVote()}
            disabled={isGlobalLoading}
            className={`${buttonBaseClass} text-white`}
            style={{
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            }}
          >
            <Vote size={14} /> Vote Now
          </button>
        )}

        {isMember && hasVoted && !votingEnded && (
          <button
            onClick={() => onVote()}
            className={`${buttonBaseClass} bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20 transition-colors`}
          >
            <CheckCircle size={14} /> Vote Recorded
          </button>
        )}

        {votingEnded && (
          <button
            onClick={onExecuteVote}
            disabled={isGlobalLoading}
            className={`${buttonBaseClass} text-white`}
            style={{
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            }}
          >
            {isTargetLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Vote size={14} /> Finalize Vote
              </>
            )}
          </button>
        )}

        <div className="flex flex-wrap gap-2 w-full">
          <button
            onClick={onOpenDetails}
            disabled={isGlobalLoading}
            className={`${buttonBaseClass}`}
            style={{
              borderColor: colors.border,
              color: colors.text,
              opacity: 0.6,
            }}
          >
            <Info size={14} /> Details
          </button>
          <button
            onClick={onOpenChat}
            disabled={isGlobalLoading}
            className={`${buttonBaseClass}`}
            style={{
              borderColor: colors.border,
              color: colors.text,
              opacity: 0.6,
            }}
          >
            <MessageSquare size={14} /> Chat
          </button>
        </div>
      </div>
    );
  }

  // State: ACTIVE (3)
  if (status === "active") {
    const isRecipient = currentPosition === Number(currentRound);
    const gracePeriodPassed = now > Number(circle.contributionDeadline);
    const hasPayout = circle.payouts.some((p) => Number(p.round) === Number(currentRound));
    const lateMembersList = circle.membersList
      .filter((m) => m.isActive && !m.hasContributed)
      .map((m) => m.id);
    
    // Forfeit logic: available if grace passed, no payout yet, and user is recipient OR has already contributed
    const showForfeit =
      isMember &&
      (isRecipient || hasContributed) &&
      gracePeriodPassed &&
      lateMembersList.length > 0 &&
      !hasPayout;

    return (
      <div
        className="flex flex-col gap-3 pt-4 border-t"
        style={{ borderColor: `${colors.border}40` }}
      >
        <div className="flex flex-col gap-2 w-full">
          {showForfeit ? (
            <button
              onClick={() => onForfeit(lateMembersList)}
              disabled={isGlobalLoading}
              className={`${buttonBaseClass} bg-rose-500 text-white border-rose-500`}
            >
              {isTargetLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <UserX size={14} /> Forfeit Late Members
                </>
              )}
            </button>
          ) : isMember && !isForfeitedThisRound ? (
            hasContributed ? (
              <button
                disabled
                className={`${buttonBaseClass} bg-emerald-500/5 text-emerald-600 border-emerald-500/10`}
              >
                <CheckCircle size={14} />
                <span>Round Contributed</span>
              </button>
            ) : (
              <button
                onClick={onContribute}
                disabled={isGlobalLoading}
                className={`${buttonBaseClass} text-white`}
                style={{
                  backgroundColor: isPastDeadline ? "#f59e0b" : "#10b981",
                  borderColor: isPastDeadline ? "#f59e0b" : "#10b981",
                }}
              >
                {isTargetLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <DollarSign size={14} />{" "}
                    {isPastDeadline ? "Contribute (Late)" : "Contribute"}
                  </>
                )}
              </button>
            )
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 w-full">
          <button
            onClick={onOpenDetails}
            disabled={isGlobalLoading}
            className={`${buttonBaseClass}`}
            style={{
              borderColor: colors.border,
              color: colors.text,
              opacity: 0.6,
            }}
          >
            <Info size={14} /> Details
          </button>
          <button
            onClick={onOpenChat}
            disabled={isGlobalLoading}
            className={`${buttonBaseClass}`}
            style={{
              borderColor: colors.border,
              color: colors.text,
              opacity: 0.6,
            }}
          >
            <MessageSquare size={14} /> Chat
          </button>
        </div>
      </div>
    );
  }

  // State: COMPLETED (4) or DEAD (5)
  if (status === "completed" || status === "dead") {
    return (
      <div
        className="flex flex-col gap-3 pt-4 border-t"
        style={{ borderColor: `${colors.border}40` }}
      >
        <div
          className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-black uppercase tracking-widest text-[10px] border-2 ${status === "completed" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"}`}
        >
          {status === "completed" ? (
            <CheckCircle size={14} />
          ) : (
            <AlertTriangle size={14} />
          )}
          {status === "completed" ? "Goal Achieved" : "Circle Terminated"}
        </div>
        {isMember && status === "dead" && !hasWithdrawn && (
          <button
            onClick={onWithdrawCollateral}
            disabled={isGlobalLoading}
            className={`${buttonBaseClass} text-white`}
            style={{
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            }}
          >
            {isTargetLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <DollarSign size={14} /> Withdraw
              </>
            )}
          </button>
        )}
        <div className="flex flex-wrap gap-2 w-full">
          <button
            onClick={onOpenDetails}
            disabled={isGlobalLoading}
            className={`${buttonBaseClass}`}
            style={{
              borderColor: colors.border,
              color: colors.text,
              opacity: 0.6,
            }}
          >
            <Info size={14} /> History
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onOpenDetails}
      disabled={isGlobalLoading}
      className={`${buttonBaseClass} flex-1 w-full`}
      style={{ borderColor: colors.border, color: colors.text, opacity: 0.6 }}
    >
      <Info size={14} /> View Status
    </button>
  );
};
