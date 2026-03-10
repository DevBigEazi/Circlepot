"use client";

import { X, AlertTriangle, Wallet, ArrowRight } from "lucide-react";
import { ThemeColors } from "../../hooks/useThemeColors";

interface WithdrawCollateralModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  circleName: string;
  collateralLocked: string;
  creatorDeadFee: string;
  netAmount: string;
  isCreator: boolean;
  withdrawalReason: "vote_failed" | "below_threshold" | "completed";
  isLoading: boolean;
  colors: ThemeColors;
}

export const WithdrawCollateralModal = ({
  isOpen,
  onClose,
  onConfirm,
  circleName,
  collateralLocked,
  creatorDeadFee,
  netAmount,
  isCreator,
  withdrawalReason,
  isLoading,
  colors,
}: WithdrawCollateralModalProps) => {
  if (!isOpen) return null;

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
              <Wallet size={24} />
            </div>
            <div>
              <h2
                className="text-2xl font-black tracking-tight"
                style={{ color: colors.text }}
              >
                Withdrawal
              </h2>
              <p className="text-xs font-bold opacity-40 uppercase tracking-widest">
                {circleName}
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-5 flex gap-4 items-start">
            <AlertTriangle className="text-rose-500 shrink-0" size={24} />
            <div className="space-y-1">
              <p className="text-xs font-bold text-rose-500/80 leading-relaxed uppercase tracking-widest">
                {withdrawalReason === "completed"
                  ? "Goal Achieved"
                  : "Circle Terminated"}
              </p>
              <p className="text-[10px] font-bold opacity-60 leading-relaxed">
                {withdrawalReason === "completed"
                  ? "This circle has successfully completed! Your collateral is now eligible for return."
                  : withdrawalReason === "vote_failed"
                    ? "The vote to terminate the circle has passed. You can now withdraw your locked collateral."
                    : "The circle did not reach the required minimum members to start. Your collateral is being returned."}
              </p>
            </div>
          </div>

          <div
            className="p-6 rounded-3xl space-y-4"
            style={{ backgroundColor: `${colors.text}05` }}
          >
            <div className="flex justify-between items-center opacity-60">
              <span className="text-[10px] font-black uppercase tracking-widest">
                Collateral Locked
              </span>
              <span className="text-sm font-black">$ {collateralLocked}</span>
            </div>

            {isCreator && Number(creatorDeadFee) > 0 && (
              <div className="flex justify-between items-center text-rose-500 mb-2 pt-2 border-t border-black/5">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Dead Circle Fee
                  </span>
                  <span className="text-[8px] font-bold opacity-60">
                    Platform fee for failed creators
                  </span>
                </div>
                <span className="text-sm font-black">- $ {creatorDeadFee}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-black/5">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
                  Net Return
                </span>
                <div
                  className="text-2xl font-black"
                  style={{ color: colors.text }}
                >
                  $ {netAmount} USDT
                </div>
              </div>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{
                  backgroundColor: `${colors.primary}20`,
                  color: colors.primary,
                }}
              >
                <ArrowRight size={24} />
              </div>
            </div>
          </div>
        </div>

        <div
          className="p-8 border-t flex gap-4"
          style={{ borderColor: `${colors.border}40` }}
        >
          <button
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2 transition-all hover:bg-black/5"
            style={{ borderColor: colors.border, color: colors.text }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-3 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-primary text-white shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            style={{ backgroundColor: colors.primary }}
          >
            {isLoading ? "Withdrawing..." : "Confirm Withdrawal"}
          </button>
        </div>
      </div>
    </div>
  );
};
