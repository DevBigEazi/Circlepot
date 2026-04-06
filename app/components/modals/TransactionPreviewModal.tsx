"use client";

import React from "react";
import {
  X,
  ArrowRight,
  Wallet,
  User,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Globe,
} from "lucide-react";
import { useThemeColors } from "@/app/hooks/useThemeColors";
import { Profile } from "@/app/types/profile";
import Image from "next/image";

interface TransactionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
  type: "internal" | "external";
  amount: string;
  recipient: Profile | string;
  fee: string;
  total: string;
}

const TransactionPreviewModal: React.FC<TransactionPreviewModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isProcessing,
  type,
  amount,
  recipient,
  fee,
  total,
}) => {
  const colors = useThemeColors();

  if (!isOpen) return null;

  const isExternal = type === "external";
  const recipientProfile = !isExternal ? (recipient as Profile) : null;
  const recipientAddress = isExternal ? (recipient as string) : "";

  return (
    <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
        onClick={isProcessing ? undefined : onClose}
      />

      {/* Modal Content */}
      <div
        className="relative w-full sm:max-w-md bg-surface rounded-t-[40px] sm:rounded-3xl shadow-2xl overflow-hidden border-x-4 border-t-4 sm:border-0 animate-in slide-in-from-bottom-20 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 max-h-[90vh] flex flex-col"
        style={{
          backgroundColor: colors.surface,
          borderColor: isExternal ? colors.border : colors.primary + "20",
        }}
      >
        {/* Header */}
        <div
          className="p-5 sm:p-8 flex justify-between items-center border-b border-dashed"
          style={{ borderColor: colors.border }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-xl shadow-inner-sm"
              style={{
                backgroundColor: colors.primary + "15",
                color: colors.primary,
              }}
            >
              <ShieldCheck size={20} className="drop-shadow-sm sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2
                className="text-lg sm:text-xl font-black tracking-tight leading-none"
                style={{ color: colors.text }}
              >
                Review Transfer
              </h2>
              <p
                className="text-[9px] sm:text-[10px] uppercase tracking-widest font-black opacity-40 mt-1"
                style={{ color: colors.text }}
              >
                Verification Step
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 sm:p-2 rounded-xl transition hover:bg-black/5 disabled:opacity-30"
            style={{ backgroundColor: colors.background }}
          >
            <X size={18} style={{ color: colors.text }} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-8 space-y-6 sm:space-y-8 overflow-y-auto custom-scrollbar">
          {/* Recipient Card */}
          <div className="space-y-2 sm:space-y-3">
            <p
              className="text-[10px] sm:text-xs font-black uppercase tracking-widest opacity-40 ml-1"
              style={{ color: colors.text }}
            >
              Recipient
            </p>
            {isExternal ? (
              <div
                className="p-4 sm:p-5 rounded-2xl border-2 flex items-center gap-3 sm:gap-4 bg-emerald-500/5 border-emerald-500/10"
              >
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                  style={{
                    backgroundColor: colors.primary + "10",
                    color: colors.primary,
                  }}
                >
                  <Wallet size={20} className="sm:w-6 sm:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4
                    className="font-black text-xs sm:text-sm break-all leading-tight"
                    style={{ color: colors.text }}
                  >
                    {recipientAddress}
                  </h4>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span
                      className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wide opacity-50"
                      style={{ color: colors.text }}
                    >
                      Avalanche Network
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              recipientProfile && (
                <div className="p-4 sm:p-5 rounded-2xl border-2 flex items-center gap-3 sm:gap-4 bg-emerald-500/5 border-emerald-500/10">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden bg-white border-2 border-white shadow-md shrink-0">
                    {recipientProfile.profilePhoto ? (
                      <Image
                        src={recipientProfile.profilePhoto}
                        alt={recipientProfile.username}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                        <User size={24} className="sm:w-7 sm:h-7" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4
                      className="font-black text-sm sm:text-base truncate leading-tight"
                      style={{ color: colors.text }}
                    >
                      {recipientProfile.firstName} {recipientProfile.lastName}
                    </h4>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span
                        className="text-xs font-bold truncate max-w-[80px] sm:max-w-none"
                        style={{ color: colors.primary }}
                      >
                        @{recipientProfile.username}
                      </span>
                      <div className="w-0.5 h-0.5 rounded-full bg-gray-300 sm:mx-0.5" />
                      <span
                        className="text-[9px] sm:text-[10px] font-black uppercase opacity-40 whitespace-nowrap"
                        style={{ color: colors.text }}
                      >
                        Internal
                      </span>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Amount Breakdown */}
          <div
            className="p-5 sm:p-6 rounded-3xl space-y-4 sm:space-y-5 border-2 relative overflow-hidden"
            style={{
              backgroundColor: colors.background,
              borderColor: colors.border,
            }}
          >
            <div className="absolute top-0 right-0 p-3 opacity-[0.03] pointer-events-none">
              <Globe size={60} className="sm:w-20 sm:h-20" />
            </div>

            <div className="flex justify-between items-center relative z-10 gap-2">
              <span
                className="text-[10px] sm:text-xs font-bold opacity-50 shrink-0"
                style={{ color: colors.text }}
              >
                Transfer Amount
              </span>
              <span
                className="font-black text-sm sm:text-base truncate"
                style={{ color: colors.text }}
              >
                {amount} USDT
              </span>
            </div>

            <div className="flex justify-between items-center relative z-10 gap-2">
              <span
                className="text-[10px] sm:text-xs font-bold opacity-50 shrink-0"
                style={{ color: colors.text }}
              >
                Transaction Fee
              </span>
              <span
                className={`text-[10px] sm:text-xs font-black uppercase tracking-wider ${
                  Number(fee) === 0 ? "text-emerald-500" : "text-amber-500"
                }`}
              >
                {Number(fee) === 0 ? "FREE" : `${fee} USDT`}
              </span>
            </div>

            <div
              className="pt-4 border-t border-dashed relative z-10"
              style={{ borderColor: colors.border }}
            >
              <div className="flex justify-between items-end gap-2">
                <span
                  className="text-[10px] sm:text-xs font-black uppercase tracking-widest opacity-60 shrink-0 mb-1"
                  style={{ color: colors.text }}
                >
                  Total
                </span>
                <div className="text-right min-w-0">
                  <div className="flex items-baseline gap-1 justify-end flex-wrap">
                    <h3
                      className="text-xl sm:text-3xl font-black leading-none break-all"
                      style={{ color: colors.text }}
                    >
                      {total}
                    </h3>
                    <span className="text-[9px] sm:text-[10px] font-black opacity-30">
                      USDT
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Safety Warning for External */}
          {isExternal && (
            <div
              className="p-3 sm:p-4 rounded-2xl flex gap-3 items-start border-2 border-amber-500/10"
              style={{ backgroundColor: "#FFFBEB" }}
            >
              <AlertTriangle
                size={16}
                className="text-amber-600 shrink-0 mt-0.5"
              />
              <p className="text-[10px] sm:text-[11px] font-bold leading-relaxed text-amber-900/80">
                Ensure the recipient address is correct for the{" "}
                <strong>Avalanche network</strong>. Transactions are
                irreversible.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className="p-5 sm:p-8 border-t"
          style={{
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <div className="flex gap-3 sm:gap-4">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 py-3.5 sm:py-4 px-4 sm:px-6 rounded-2xl font-black text-xs sm:text-sm transition-all active:scale-95 disabled:opacity-30 border-2"
              style={{
                borderColor: colors.border,
                backgroundColor: colors.background,
                color: colors.text,
              }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isProcessing}
              className="flex-2 py-3.5 sm:py-4 px-4 sm:px-6 rounded-2xl font-black text-xs sm:text-sm text-white shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              style={{ background: colors.primary }}
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <span>Confirm</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionPreviewModal;
