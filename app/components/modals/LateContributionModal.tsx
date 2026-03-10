"use client";

import React from "react";
import { X, Clock, AlertTriangle, ShieldAlert, ArrowRight } from "lucide-react";
import { useThemeColors } from "../../hooks/useThemeColors";

interface LateContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  circleName: string;
  contributionAmount: string;
  lateFee: string;
  isLoading: boolean;
}

export const LateContributionModal: React.FC<LateContributionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  circleName,
  contributionAmount,
  lateFee,
  isLoading,
}) => {
  const colors = useThemeColors();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-sm sm:max-w-md bg-surface rounded-3xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden border-4 animate-in fade-in zoom-in duration-300"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        <div
          className="p-5 sm:p-8 border-b relative"
          style={{ borderColor: `${colors.border}40` }}
        >
          <button
            onClick={onClose}
            className="absolute right-5 sm:right-8 top-5 sm:top-8 p-1.5 sm:p-2 rounded-xl hover:bg-black/5 transition-colors"
          >
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>

          <div className="flex items-center gap-4 mb-2">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: colors.background, color: "#f59e0b" }}
            >
              <Clock size={24} />
            </div>
            <div>
              <h2
                className="text-lg sm:text-2xl font-black tracking-tight"
                style={{ color: colors.text }}
              >
                Late Contribution
              </h2>
              <p className="text-xs font-bold opacity-40 uppercase tracking-widest">
                {circleName}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-8 space-y-4 sm:space-y-6">
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-5 flex gap-4 items-start">
            <AlertTriangle className="text-amber-500 shrink-0" size={24} />
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                Penalty applied
              </p>
              <p className="text-xs font-bold text-amber-700/80 leading-relaxed">
                You are contributing after the round deadline. A 1% penalty
                based on your collateral will be deducted.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-black/5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
                  Contribution
                </span>
                <span
                  className="text-sm font-black"
                  style={{ color: colors.text }}
                >
                  ${contributionAmount} USDT
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">
                  Late Fee (1%)
                </span>
                <span className="text-sm font-black text-rose-500">
                  -${lateFee} USDT
                </span>
              </div>
              <div className="pt-3 border-t border-black/5 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                  Impact
                </span>
                <div className="flex items-center gap-2 text-rose-500 text-[10px] font-black">
                  <ShieldAlert size={14} /> Fee from collateral
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="p-5 sm:p-8 border-t flex flex-row gap-2 sm:gap-4"
          style={{ borderColor: `${colors.border}40` }}
        >
          <button
            onClick={onClose}
            className="flex-1 py-3.5 sm:py-4 rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] border-2 transition-all hover:bg-black/5"
            style={{ borderColor: colors.border, color: colors.text }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-3 py-3.5 sm:py-4 rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] bg-[#f59e0b] text-white shadow-xl shadow-amber-500/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5 sm:gap-2"
          >
            {isLoading ? (
              "Processing..."
            ) : (
              <>
                <ArrowRight size={12} className="sm:w-3.5 sm:h-3.5" />
                <span>Pay Late</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
