/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import {
  Users,
  Calendar,
  TrendingUp,
  Clock,
  Award,
  ShieldAlert,
  User,
} from "lucide-react";
import { ActiveCircle, CircleActionData } from "../types/savings";
import { useThemeColors } from "../hooks/useThemeColors";
import { CircleActions } from "./CircleActions";

interface ActiveCircleCardProps {
  circle: ActiveCircle;
  currentUserAddress?: string;
  onAction: (action: string, data?: CircleActionData | null) => void;
  isGlobalLoading?: boolean;
  isTargetLoading?: boolean;
}

export default function ActiveCircleCard({
  circle,
  currentUserAddress,
  onAction,
  isGlobalLoading = false,
  isTargetLoading = false,
}: ActiveCircleCardProps) {
  const colors = useThemeColors();
  const {
    name,
    totalPositions,
    currentPosition,
    payoutAmount,
    nextPayout,
    status,
    membersList,
    currentRound,
    isForfeited,
    rawCircle,
  } = circle;

  const userAddressLower = currentUserAddress?.toLowerCase();
  const isCreator = rawCircle.creator.id.toLowerCase() === userAddressLower;
  const isMember = currentPosition > 0;

  const statusConfig = {
    pending: { bg: "#f3f4f6", text: "#4b5563", label: "Queued" },
    created: { bg: "#dbeafe", text: "#2563eb", label: "Gathering" },
    voting: { bg: "#fef3c7", text: "#d97706", label: "Voting" },
    active: { bg: "#dcfce7", text: "#16a34a", label: "Ongoing" },
    completed: { bg: "#f3e8ff", text: "#9333ea", label: "Finished" },
    dead: { bg: "#fee2e2", text: "#dc2626", label: "Terminated" },
    unknown: { bg: "#f3f4f6", text: "#4b5563", label: "Unknown" },
  };

  const currentStatus =
    statusConfig[status as keyof typeof statusConfig] || statusConfig.unknown;

  return (
    <div
      className="group rounded-4xl sm:rounded-[2.5rem] p-5 sm:p-6 border transition-all duration-300 bg-surface relative overflow-hidden"
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
      }}
    >
      {/* Status Badge & ID */}
      <div className="flex justify-between items-start mb-5 sm:mb-6">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="px-2.5 py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest whitespace-nowrap"
              style={{
                backgroundColor: currentStatus.bg,
                color: currentStatus.text,
              }}
            >
              • {currentStatus.label}
            </span>
            {isMember && (
              <span className="px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest opacity-60">
                Pos #{currentPosition}
              </span>
            )}
            {isCreator && (
              <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[8px] sm:text-[9px] font-black uppercase tracking-widest">
                Creator
              </span>
            )}
          </div>
          <h3
            className="text-lg sm:text-xl font-black tracking-tight truncate"
            style={{ color: colors.text }}
          >
            {name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-4 h-4 rounded-full bg-black/5 overflow-hidden flex items-center justify-center">
              {rawCircle.creator.avatarUrl ? (
                <img
                  src={rawCircle.creator.avatarUrl}
                  alt={rawCircle.creator.username || "Creator"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={10} className="opacity-40" />
              )}
            </div>
            <span className="text-[10px] font-bold opacity-40">
              by{" "}
              {rawCircle.creator.fullName === "You" ? (
                "You"
              ) : rawCircle.creator.fullName &&
                rawCircle.creator.fullName.includes(" ") ? (
                <>
                  <span>{rawCircle.creator.fullName.split(" ")[0]}</span>
                  <span className="hidden sm:inline">
                    {" "}
                    {rawCircle.creator.fullName.split(" ").slice(1).join(" ")}
                  </span>
                </>
              ) : (
                rawCircle.creator.fullName ||
                rawCircle.creator.username ||
                rawCircle.creator.id.slice(0, 8)
              )}
            </span>
          </div>
        </div>
        <div
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center opacity-30 shrink-0"
          style={{ backgroundColor: colors.background, color: colors.primary }}
        >
          <Award size={20} className="sm:w-6 sm:h-6" />
        </div>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-5 sm:mb-6">
        <div
          className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-opacity-40"
          style={{ backgroundColor: colors.background }}
        >
          <div className="flex items-center gap-2 mb-1.5 opacity-40">
            <TrendingUp size={12} style={{ color: colors.primary }} />
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
              Payout
            </span>
          </div>
          <div
            className="text-lg sm:text-xl font-black tracking-tight"
            style={{ color: colors.text }}
          >
            ${Number(payoutAmount).toLocaleString()}{" "}
            <span className="text-[9px] opacity-40 font-bold ml-0.5 uppercase">
              USDT
            </span>
          </div>
        </div>
        <div
          className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-opacity-40"
          style={{ backgroundColor: colors.background }}
        >
          <div className="flex items-center gap-2 mb-1.5 opacity-40">
            <Clock size={12} style={{ color: colors.primary }} />
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
              Round
            </span>
          </div>
          <div
            className="text-lg sm:text-xl font-black tracking-tight"
            style={{ color: colors.text }}
          >
            {currentRound}/{totalPositions}
          </div>
        </div>
      </div>

      {/* Member Slots & Collateral Badges */}
      <div className="space-y-4 mb-5 sm:mb-6">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 opacity-50 min-w-0">
            <Users size={12} className="shrink-0" />
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest truncate">
              {rawCircle.currentMembers} / {totalPositions} Members
            </span>
          </div>
          <div className="flex -space-x-1.5 shrink-0">
            {membersList.slice(0, 3).map((m, idx) => (
              <div
                key={m.id}
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center text-[7px] sm:text-[8px] font-bold overflow-hidden ${m.id.startsWith("empty") ? "opacity-20" : ""}`}
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.background,
                  color: m.id.startsWith("empty")
                    ? colors.text
                    : colors.primary,
                  zIndex: 3 - idx,
                }}
              >
                {m.avatarUrl ? (
                  <img
                    src={m.avatarUrl}
                    alt={m.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  m.username.slice(0, 2).toUpperCase()
                )}
              </div>
            ))}
            {membersList.length > 3 && (
              <div
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center text-[7px] sm:text-[8px] font-bold z-0"
                style={{
                  backgroundColor: colors.background,
                  borderColor: colors.surface,
                  color: colors.text,
                }}
              >
                +{membersList.length - 3}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div
        className="pt-4 border-t"
        style={{ borderColor: `${colors.border}40` }}
      >
        <div className="flex items-center justify-between px-1 mb-4">
          <div className="flex items-center gap-2 opacity-50">
            <Calendar size={12} />
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
              {status === "active"
                ? `Next: ${nextPayout}`
                : `Starts: On Reach 60%`}
            </span>
          </div>
          {isForfeited && (
            <span className="px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-500 text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
              <ShieldAlert size={10} /> Forfeited
            </span>
          )}
        </div>

        <CircleActions
          circle={circle}
          isCreator={isCreator}
          isMember={isMember}
          onContribute={() => onAction("contribute", circle)}
          onInitiateVoting={() => onAction("initiateVoting", circle)}
          onVote={(choice) => onAction("vote", { ...circle, choice })}
          onExecuteVote={() => onAction("executeVote", circle)}
          onWithdrawCollateral={() => onAction("withdrawCollateral", circle)}
          onForfeit={(lateMembers) =>
            onAction("forfeit", { ...circle, lateMembers })
          }
          onInviteMembers={() => onAction("invite", circle)}
          onOpenDetails={() => onAction("details", circle)}
          onOpenChat={() => onAction("chat", circle)}
          onUpdateVisibility={() => onAction("updateVisibility", circle)}
          colors={colors}
          isGlobalLoading={isGlobalLoading}
          isTargetLoading={isTargetLoading}
        />
      </div>
    </div>
  );
}
