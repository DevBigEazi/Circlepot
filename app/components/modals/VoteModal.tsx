"use client";

import React, { useState } from "react";
import { X, CheckCircle, UserX, Loader2, Info } from "lucide-react";
import { useThemeColors } from "../../hooks/useThemeColors";

interface VoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVote: (choice: boolean) => void;
  circleName: string;
  isLoading: boolean;
  startVotes?: number;
  withdrawVotes?: number;
  totalMembers?: number;
}

export const VoteModal: React.FC<VoteModalProps> = ({
  isOpen,
  onClose,
  onVote,
  circleName,
  isLoading,
  startVotes = 0,
  withdrawVotes = 0,
  totalMembers = 0,
}) => {
  const colors = useThemeColors();
  const [selectedChoice, setSelectedChoice] = useState<boolean | null>(null);

  if (!isOpen) return null;

  const handleVote = (choice: boolean) => {
    setSelectedChoice(choice);
    onVote(choice);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-md bg-surface rounded-[2.5rem] shadow-2xl overflow-hidden border-4 animate-in fade-in zoom-in duration-300"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        <div
          className="p-8 border-b relative"
          style={{ borderColor: `${colors.border}40` }}
        >
          <button
            onClick={onClose}
            className="absolute right-8 top-8 p-2 rounded-xl hover:bg-black/5 transition-colors"
          >
            <X size={24} />
          </button>

          <div className="flex items-center gap-4 mb-2">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor: colors.background,
                color: colors.primary,
              }}
            >
              <CheckCircle size={24} />
            </div>
            <div>
              <h2
                className="text-2xl font-black tracking-tight"
                style={{ color: colors.text }}
              >
                Cast Vote
              </h2>
              <p className="text-xs font-bold opacity-40 uppercase tracking-widest">
                {circleName}
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-black/5 rounded-2xl p-5 flex gap-4 items-start border-2 border-dashed border-black/10">
            <Info className="opacity-40 shrink-0" size={20} />
            <div className="space-y-3">
              <p className="text-xs font-medium opacity-60 leading-relaxed">
                The circle has not reached its minimum member requirement.
                Members must vote to either <strong>Start Anyway</strong> or{" "}
                <strong>Withdraw Collateral</strong>.
              </p>

              {totalMembers > 0 && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
                      Voting Progress
                    </span>
                    <span className="text-[10px] font-black opacity-60">
                      {startVotes + withdrawVotes} / {totalMembers} voted
                    </span>
                  </div>
                  <div
                    className="w-full h-1.5 rounded-full overflow-hidden flex"
                    style={{ backgroundColor: `${colors.border}40` }}
                  >
                    <div
                      className="h-full transition-all duration-500 bg-emerald-500"
                      style={{ width: `${(startVotes / totalMembers) * 100}%` }}
                    />
                    <div
                      className="h-full transition-all duration-500 bg-rose-500"
                      style={{
                        width: `${(withdrawVotes / totalMembers) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[8px] font-bold uppercase tracking-tighter">
                    <span className="text-emerald-600">{startVotes} Start</span>
                    <span className="text-rose-600">
                      {withdrawVotes} Withdraw
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => handleVote(true)}
              disabled={isLoading}
              className="group relative w-full p-6 rounded-3xl border-2 transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-between"
              style={{
                borderColor:
                  selectedChoice === true ? colors.primary : colors.border,
                backgroundColor:
                  selectedChoice === true
                    ? `${colors.primary}10`
                    : colors.surface,
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <CheckCircle size={20} />
                </div>
                <div className="text-left">
                  <div
                    className="font-black text-sm flex items-center gap-2"
                    style={{ color: colors.text }}
                  >
                    Start Anyway
                    {startVotes > 0 && (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
                        {startVotes}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-bold opacity-40">
                    Proceed with current members
                  </div>
                </div>
              </div>
              {isLoading && selectedChoice === true && (
                <Loader2 size={16} className="animate-spin" />
              )}
            </button>

            <button
              onClick={() => handleVote(false)}
              disabled={isLoading}
              className="group relative w-full p-6 rounded-3xl border-2 transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-between"
              style={{
                borderColor:
                  selectedChoice === false ? "#ef4444" : colors.border,
                backgroundColor:
                  selectedChoice === false ? "#ef444410" : colors.surface,
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <UserX size={20} />
                </div>
                <div className="text-left">
                  <div
                    className="font-black text-sm flex items-center gap-2"
                    style={{ color: colors.text }}
                  >
                    Withdraw Collateral
                    {withdrawVotes > 0 && (
                      <span className="px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-600 text-[10px] font-bold">
                        {withdrawVotes}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-bold opacity-40">
                    Close circle & return funds
                  </div>
                </div>
              </div>
              {isLoading && selectedChoice === false && (
                <Loader2 size={16} className="animate-spin" />
              )}
            </button>
          </div>
        </div>

        <div
          className="p-8 border-t"
          style={{ borderColor: `${colors.border}40` }}
        >
          <button
            onClick={onClose}
            className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs bg-black text-white hover:opacity-90 transition-opacity"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
