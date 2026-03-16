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
  Users,
  Trophy,
  ShieldCheck,
  ShieldAlert,
  TrendingUp,
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
    case "circle_joined":
      return <Users size={32} />;
    case "circle_created":
      return <Users size={32} />;
    case "circle_contribution":
      return <TrendingUp size={32} />;
    case "circle_payout":
      return <Trophy size={32} />;
    case "circle_collateral_return":
      return <ShieldCheck size={32} />;
    case "circle_forfeit":
      return <ShieldAlert size={32} />;
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
    case "circle_joined":
      return "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400";
    case "circle_created":
      return "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400";
    case "circle_contribution":
      return "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400";
    case "circle_payout":
      return "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400";
    case "circle_collateral_return":
      return "bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400";
    case "circle_forfeit":
      return "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400";
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
    case "circle_joined":
      return "You've joined a circle";
    case "circle_created":
      return "You've created a circle";
    case "circle_contribution":
      return "You've contributed";
    case "circle_payout":
      return "You've won the pot";
    case "circle_collateral_return":
      return "Deposit returned";
    case "circle_forfeit":
      return isIncoming ? "Penalty applied" : "Forfeit action";
    default:
      return isIncoming ? "You've received" : "You've sent";
  }
}

function getAmountSign(type: Transaction["type"], isIncoming: boolean) {
  switch (type) {
    case "goal_contribution":
    case "circle_joined":
    case "circle_created":
    case "circle_contribution":
      return "-";
    case "goal_withdrawal":
    case "goal_completion":
    case "circle_payout":
    case "circle_collateral_return":
      return "+";
    case "circle_forfeit":
      return "-";
    default:
      return isIncoming ? "+" : "-";
  }
}

function isSavingsType(type: Transaction["type"]) {
  return (
    type === "goal_contribution" ||
    type === "goal_withdrawal" ||
    type === "goal_completion" ||
    type === "circle_joined" ||
    type === "circle_created" ||
    type === "circle_contribution" ||
    type === "circle_payout" ||
    type === "circle_collateral_return" ||
    type === "circle_forfeit"
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

  const goalName = transaction.metadata?.goalName;
  const circleName = transaction.metadata?.circleName;

  const isSavings = isSavingsType(transaction.type);
  const isCircle =
    transaction.type === "circle_joined" ||
    transaction.type === "circle_created" ||
    transaction.type === "circle_contribution" ||
    transaction.type === "circle_payout" ||
    transaction.type === "circle_collateral_return" ||
    transaction.type === "circle_forfeit";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-sm bg-surface rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden border-x-4 border-t-4 sm:border-4 animate-in fade-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 max-h-[90vh] flex flex-col"
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
            {/* Goal/Circle Name — shown for savings */}
            {isSavings && (goalName || circleName) && (
              <div className="space-y-1">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest opacity-40"
                  style={{ color: colors.text }}
                >
                  {isCircle ? "Circle" : "Goal"}
                </span>
                <p
                  className="text-sm font-bold"
                  style={{ color: colors.primary }}
                >
                  {isCircle ? circleName : goalName}
                </p>
              </div>
            )}

            {/* Note — shown for various events like fees or early withdrawals */}
            {transaction.metadata?.note && (
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
                {transaction.type === "circle_forfeit" &&
                  transaction.metadata.note.includes("Penalty") && (
                    <p className="text-[10px] font-black uppercase tracking-tighter text-rose-500 mt-1">
                      * Removed from circle collateral
                    </p>
                  )}
              </div>
            )}

            {/* Payout Fee Section */}
            {transaction.metadata?.payoutFee && (
              <div className="space-y-1">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest opacity-40"
                  style={{ color: colors.text }}
                >
                  Platform Handling Fee
                </span>
                <div className="flex items-center gap-1.5 text-sm font-bold text-rose-500">
                  -${transaction.metadata.payoutFee}
                  <p className="text-[10px] font-medium opacity-50 text-rose-500/70">
                    (Deducted from pot)
                  </p>
                </div>
              </div>
            )}

            {/* Counterparty — shown only for internal profile transfers */}
            {!isSavings &&
              (transaction.isIncoming
                ? transaction.fromName || isInternal
                : transaction.toName || isInternal) && (
                <div className="space-y-1">
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest opacity-40"
                    style={{ color: colors.text }}
                  >
                    {transaction.isIncoming ? "From" : "To"}
                  </span>
                  <p
                    className="text-sm font-bold truncate"
                    style={{ color: colors.primary }}
                  >
                    {transaction.isIncoming
                      ? transaction.fromName || transaction.displayName
                      : transaction.toName || transaction.displayName}
                  </p>
                  {(transaction.fromName || transaction.toName) && (
                    <p
                      className="text-[10px] opacity-60 font-medium"
                      style={{ color: colors.text }}
                    >
                      {transaction.displayName}
                    </p>
                  )}
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
