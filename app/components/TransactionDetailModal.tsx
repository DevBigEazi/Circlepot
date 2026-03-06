"use client";

import React from "react";
import { Transaction } from "../types/transaction";
import { useThemeColors } from "../hooks/useThemeColors";
import { useCurrency } from "./CurrencyProvider";
import { useCurrencyConverter } from "../hooks/useCurrencyConverter";
import {
  X,
  ExternalLink,
  Send,
  Download,
  CheckCircle2,
  Target,
  Wallet,
} from "lucide-react";
import { format } from "date-fns";

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

// ---------- Helpers ----------

function getModalIcon(type: Transaction["type"], isIncoming: boolean) {
  switch (type) {
    case "goal_contribution":
      return <Target size={32} />;
    case "goal_withdrawal":
      return <Wallet size={32} />;
    case "goal_completion":
      return <CheckCircle2 size={32} />;
    default:
      return isIncoming ? <Download size={32} /> : <Send size={32} />;
  }
}

function getModalIconClasses(type: Transaction["type"], isIncoming: boolean) {
  switch (type) {
    case "goal_contribution":
      return "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400";
    case "goal_withdrawal":
      return "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400";
    case "goal_completion":
      return "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400";
    default:
      return isIncoming
        ? "bg-green-100 text-green-600"
        : "bg-red-100 text-red-600";
  }
}

function getSummaryText(type: Transaction["type"], isIncoming: boolean) {
  switch (type) {
    case "goal_contribution":
      return "You've saved";
    case "goal_withdrawal":
      return "You've withdrawn";
    case "goal_completion":
      return "You've completed a goal";
    default:
      return isIncoming ? "You've received" : "You've sent";
  }
}

function getAmountSign(type: Transaction["type"], isIncoming: boolean) {
  switch (type) {
    case "goal_contribution":
      return "-";
    case "goal_withdrawal":
    case "goal_completion":
      return "+";
    default:
      return isIncoming ? "+" : "-";
  }
}

function isSavingsType(type: Transaction["type"]) {
  return (
    type === "goal_contribution" ||
    type === "goal_withdrawal" ||
    type === "goal_completion"
  );
}

// ---------- Component ----------

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
}) => {
  const colors = useThemeColors();
  const { selectedCurrency } = useCurrency();
  const { convertToLocal, availableCurrencies } = useCurrencyConverter();

  if (!transaction) return null;

  const formattedDate = format(
    transaction.timestamp * 1000,
    "MMMM dd, yyyy 'at' hh:mm a",
  );

  const isInternal = transaction.displayName?.startsWith("@");
  const goalName =
    transaction.metadata?.goalName || transaction.displayName || "";
  const isSavings = isSavingsType(transaction.type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 backdrop-blur-sm bg-black/20 dark:bg-black/60 transition-opacity duration-300"
        onClick={onClose}
      />

      <div
        className="w-full max-w-sm rounded-[32px] overflow-hidden border shadow-2xl relative animate-in fade-in zoom-in-95 duration-300"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-2">
          <h2 className="text-xl font-bold" style={{ color: colors.text }}>
            {isSavings ? "Savings Details" : "Transaction Details"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition hover:bg-black/5 dark:hover:bg-white/5"
            style={{ color: colors.text }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 pt-2 space-y-6">
          {/* Status Icon & Summary */}
          <div className="flex flex-col items-center justify-center pt-2">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${getModalIconClasses(transaction.type, transaction.isIncoming)}`}
            >
              {getModalIcon(transaction.type, transaction.isIncoming)}
            </div>

            {/* Summary text */}
            <span
              className="text-base font-bold mb-1"
              style={{ color: colors.textLight }}
            >
              {getSummaryText(transaction.type, transaction.isIncoming)}
            </span>

            <span
              className="text-3xl font-black"
              style={{ color: colors.text }}
            >
              {getAmountSign(transaction.type, transaction.isIncoming)}$
              {Number(transaction.amount).toFixed(2)}
            </span>

            {selectedCurrency !== "USD" && (
              <span
                className="text-sm font-bold opacity-60 mt-1"
                style={{ color: colors.text }}
              >
                ≈ {availableCurrencies[selectedCurrency]?.symbol || ""}
                {convertToLocal(
                  Number(transaction.amount),
                  selectedCurrency,
                )}{" "}
                {selectedCurrency}
              </span>
            )}

            <div className="flex items-center gap-1.5 mt-4 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-bold ring-1 ring-green-500/20">
              <CheckCircle2 size={14} />
              COMPLETED
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-4 pt-2">
            {/* Goal Name — shown for savings */}
            {isSavings && goalName && (
              <div className="space-y-1">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest opacity-40"
                  style={{ color: colors.text }}
                >
                  Goal
                </span>
                <p
                  className="text-sm font-bold"
                  style={{ color: colors.primary }}
                >
                  {goalName}
                </p>
              </div>
            )}

            {/* Note — shown for early withdrawals and completions */}
            {(transaction.type === "goal_withdrawal" ||
              transaction.type === "goal_completion") &&
              transaction.metadata?.note && (
                <div className="space-y-1">
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest opacity-40"
                    style={{ color: colors.text }}
                  >
                    Note
                  </span>
                  <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                    {transaction.metadata.note}
                  </p>
                </div>
              )}

            {/* Counterparty — shown for internal send/receive */}
            {!isSavings && isInternal && (
              <div className="space-y-1">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest opacity-40"
                  style={{ color: colors.text }}
                >
                  {transaction.isIncoming ? "From" : "To"}
                </span>
                <p
                  className="text-sm font-bold"
                  style={{ color: colors.primary }}
                >
                  {transaction.displayName}
                </p>
              </div>
            )}

            <div className="space-y-1">
              <span
                className="text-[10px] font-bold uppercase tracking-widest opacity-40"
                style={{ color: colors.text }}
              >
                Date & Time
              </span>
              <p className="text-sm font-bold" style={{ color: colors.text }}>
                {formattedDate}
              </p>
            </div>

            {/* Blockchain Receipt Link */}
            <div className="pt-2">
              <a
                href={`https://testnet.snowtrace.io/tx/${transaction.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border text-sm font-bold transition hover:opacity-80"
                style={{
                  color: colors.primary,
                  borderColor: colors.border,
                }}
              >
                <ExternalLink size={16} />
                Blockchain Receipt
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
