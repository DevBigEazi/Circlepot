"use client";

import { X, AlertTriangle, Wallet, ArrowRight } from "lucide-react";
import { ThemeColors } from "../../hooks/useThemeColors";

interface WithdrawCollateralModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  circleName: string;
  amount: string;
  isDead: boolean;
  isLoading: boolean;
  colors: ThemeColors;
}

export const WithdrawCollateralModal = ({
  isOpen,
  onClose,
  onConfirm,
  circleName,
  amount,
  isDead,
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
            <p className="text-xs font-bold text-rose-500/80 leading-relaxed">
              {isDead
                ? "This circle has been terminated. You can now withdraw your initial collateral deposit."
                : "This circle has successfully completed! Your collateral is now eligible for return."}
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-black/5 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
                Returnable Amount
              </span>
              <div
                className="text-2xl font-black"
                style={{ color: colors.text }}
              >
                ${amount} USDT
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
              <ArrowRight size={24} />
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
