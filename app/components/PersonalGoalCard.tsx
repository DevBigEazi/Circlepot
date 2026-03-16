"use client";

import React, { useState, useEffect } from "react";
import { useThemeColors } from "../hooks/useThemeColors";
import { PersonalGoal } from "../types/savings";
import { formatUnits } from "viem";
import {
  Target,
  CheckCircle2,
  TrendingUp,
  Clock,
  ArrowRight,
} from "lucide-react";

interface PersonalGoalCardProps {
  goal: PersonalGoal;
  onClick?: () => void;
  onContribute?: (e: React.MouseEvent) => void;
  onWithdraw?: (e: React.MouseEvent) => void;
}

export default function PersonalGoalCard({
  goal,
  onClick,
  onContribute,
  onWithdraw,
}: PersonalGoalCardProps) {
  const colors = useThemeColors();

  const current = Number(formatUnits(BigInt(goal.currentAmount || "0"), 6));
  const target = Number(formatUnits(BigInt(goal.goalAmount || "0"), 6));
  const contribution = Number(
    formatUnits(BigInt(goal.contributionAmount || "0"), 6),
  );
  const progress = Math.min((current / target) * 100, 100);

  const frequencyLabel =
    ["Daily", "Weekly", "Monthly"][goal.frequency] || "Goal";

  const nextContributionTime =
    (Number(goal.updatedAt) +
      (goal.frequency === 0
        ? 86400
        : goal.frequency === 1
          ? 604800
          : 2592000)) *
    1000;

  const [countdown, setCountdown] = useState<string>("");
  const [canContribute, setCanContribute] = useState(true);

  useEffect(() => {
    if (progress >= 100) {
      setCanContribute(false);
      return;
    }
    const updateTimer = () => {
      const now = Date.now();
      if (now >= nextContributionTime) {
        setCanContribute(true);
        setCountdown("");
      } else {
        setCanContribute(false);
        const diff = nextContributionTime - now;
        const totalSeconds = Math.floor(diff / 1000);
        const d = Math.floor(totalSeconds / 86400);
        const h = Math.floor((totalSeconds % 86400) / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        if (d > 0) setCountdown(`${d}d ${h}h`);
        else if (h > 0) setCountdown(`${h}h ${m}m`);
        else setCountdown(`${m}m ${s}s`);
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [nextContributionTime, progress]);

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-2xl sm:rounded-3xl p-4 sm:p-6 border transition-all duration-500 overflow-hidden ${
        onClick
          ? "cursor-pointer hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1"
          : ""
      }`}
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
      }}
    >
      {/* Decorative background gradient */}
      <div
        className="absolute -right-4 -top-4 w-24 h-24 blur-3xl rounded-full opacity-10 transition-opacity duration-500 group-hover:opacity-20"
        style={{ backgroundColor: colors.primary }}
      />

      <div className="flex justify-between items-start mb-4 sm:mb-6 gap-2">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
            <h3
              className="font-bold text-lg sm:text-xl tracking-tight truncate max-w-[140px] sm:max-w-none"
              style={{ color: colors.text }}
            >
              {goal.goalName}
            </h3>
            {goal.isYieldEnabled && (
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider"
                style={{
                  backgroundColor: `${colors.primary}15`,
                  color: colors.primary,
                }}
              >
                <TrendingUp size={10} />
                Yield
              </div>
            )}
          </div>
          <div
            className="flex items-center gap-2 opacity-50 flex-wrap mt-1"
            style={{ color: colors.text }}
          >
            <div className="flex items-center gap-1">
              <Target size={14} />
              <span className="text-xs font-medium">
                Target: ${target.toLocaleString()} USDT
              </span>
            </div>
            <span className="text-[10px] opacity-40">•</span>
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span className="text-[11px] font-bold">
                Est:{" "}
                {new Date(Number(goal.deadline) * 1000).toLocaleDateString(
                  undefined,
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  },
                )}
              </span>
            </div>
          </div>
        </div>

        {progress >= 100 ? (
          <div
            className="p-1 px-3 rounded-xl flex items-center gap-1.5 text-[10px] font-bold shadow-sm"
            style={{
              backgroundColor: `${colors.primary}20`,
              color: colors.primary,
            }}
          >
            <CheckCircle2 size={12} />
            Completed
          </div>
        ) : (
          <div className="flex flex-col items-end gap-1.5">
            <div
              className="p-1 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest"
              style={{
                backgroundColor: colors.background,
                color: colors.text,
                opacity: 0.6,
              }}
            >
              {frequencyLabel}
            </div>
            <div className="text-[10px] font-bold opacity-40">
              ${contribution.toLocaleString()} / {["day", "week", "month"][goal.frequency] || "cycle"}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <div className="flex justify-between items-end gap-2">
            <div className="space-y-0.5 min-w-0">
              <span
                className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest opacity-40 px-0.5"
                style={{ color: colors.text }}
              >
                Currently Saved
              </span>
              <div className="flex items-baseline gap-1 truncate">
                <span
                  className="text-lg sm:text-2xl font-black truncate"
                  style={{ color: colors.text }}
                >
                  ${current.toLocaleString()}
                </span>
                <span
                  className="text-[9px] sm:text-[10px] font-bold opacity-40 shrink-0"
                  style={{ color: colors.text }}
                >
                  USDT
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span
                className="text-base sm:text-lg font-black"
                style={{ color: colors.primary }}
              >
                {Math.round(progress)}%
              </span>
            </div>
          </div>

          <div
            className="h-3 w-full rounded-full overflow-hidden p-0.5"
            style={{ backgroundColor: colors.background }}
          >
            <div
              className="h-full transition-all duration-1000 ease-out rounded-full relative"
              style={{
                width: `${progress}%`,
                backgroundColor: colors.primary,
                boxShadow: `0 0 12px ${colors.primary}40`,
              }}
            >
              {progress > 10 && (
                <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/20 blur-sm rounded-full" />
              )}
            </div>
          </div>
        </div>

        <div
          className="flex w-full items-center gap-3 pt-3 sm:pt-4 border-t"
          style={{ borderColor: `${colors.border}50` }}
        >
          <button
            onClick={(e) => {
              if (onWithdraw) {
                e.stopPropagation();
                onWithdraw(e);
              }
            }}
            className="flex-1 flex justify-center items-center px-3 py-2.5 sm:py-2 rounded-xl border text-[8px] sm:text-[11px] font-black uppercase tracking-wider text-[#ef4444] transition hover:scale-[1.02] active:scale-95"
            style={{
              borderColor: "rgba(239, 68, 68, 0.2)",
              backgroundColor: "rgba(239, 68, 68, 0.05)",
            }}
          >
            Withdraw
          </button>
          <button
            onClick={(e) => {
              if (onContribute && canContribute) {
                e.stopPropagation();
                onContribute(e);
              }
            }}
            disabled={!canContribute}
            className={`flex-1 flex justify-center items-center gap-1.5 px-3 py-2.5 sm:py-2 rounded-xl border text-[8px] sm:text-xs font-black uppercase tracking-wider transition-all duration-300 ${
              canContribute
                ? "hover:gap-2.5 hover:scale-[1.02] active:scale-95"
                : "opacity-50 cursor-not-allowed"
            }`}
            style={{
              borderColor: `${colors.primary}40`,
              color: colors.primary,
              backgroundColor: `${colors.primary}10`,
            }}
          >
            {canContribute ? (
              <>
                Add Funds <ArrowRight size={14} />
              </>
            ) : countdown ? (
              <>
                Wait {countdown} <Clock size={14} />
              </>
            ) : (
              <>
                Completed <CheckCircle2 size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
